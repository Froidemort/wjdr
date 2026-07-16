-- ============================================================================
-- 1. REFERENTIELS ET CATALOGUES GLOBAUX (Données immuables du jeu)
-- ============================================================================

-- Référentiel des Caractéristiques de Warhammer 2E
CREATE TABLE static_stats (
    code VARCHAR(3) PRIMARY KEY, -- 'CC', 'CT', 'F', 'E', 'Ag', 'Int', 'FM', 'Soc', 'A', 'B', 'M', 'Mag'
    name VARCHAR(50) NOT NULL, -- Nom complet de la caractéristique
    is_secondary BOOLEAN DEFAULT FALSE NOT NULL
);

-- Référentiel des Carrières
CREATE TABLE careers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Filières de carrières (Relation de transition N à N)
CREATE TABLE career_paths (
    from_career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
    to_career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
    PRIMARY KEY (from_career_id, to_career_id)
);

-- Référentiel des Compétences
-- TODO : ajouter une table N-à-N pour lier les talents aux compétences.
CREATE TABLE skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    is_basic BOOLEAN DEFAULT FALSE NOT NULL,
    -- La statistique liée. Elle est obligatoire.
    stat_code VARCHAR(3) REFERENCES static_stats(code) NOT NULL,
  description TEXT,
  UNIQUE (name, specialization)
);

-- Référentiel des Talents
CREATE TABLE talents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
    description TEXT,
  specialization VARCHAR(100),
  UNIQUE (name, specialization)
);

-- Catalogue des Objets / Équipements divers
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    encumbrance INT NOT NULL CHECK (encumbrance >= 0)
);

-- Référentiel des Attributs d'armes (Ex: Perforant, Lent...) -> Extrait pour la 1FN
CREATE TABLE weapon_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Catalogue des Armes disponibles
CREATE TABLE weapons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    encumbrance INT NOT NULL CHECK (encumbrance >= 0),
    damage_formula VARCHAR(20) NOT NULL,
    UNIQUE (name)
);

-- Table de liaison Armes <-> Attributs (N à N)
CREATE TABLE weapon_attribute_mappings (
    weapon_id UUID REFERENCES weapons(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES weapon_attributes(id) ON DELETE CASCADE,
    PRIMARY KEY (weapon_id, attribute_id)
);

-- Catalogue des Armures disponibles
CREATE TABLE armors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    encumbrance INT NOT NULL CHECK (encumbrance >= 0),
    armor_points INT NOT NULL,
    covered_locations TEXT[] NOT NULL CHECK (
        cardinality(covered_locations) > 0
        AND covered_locations <@ ARRAY['tête', 'corps', 'bras', 'jambes']::TEXT[]
    ),
  UNIQUE (name)
);



-- ============================================================================
-- 2. INFRASTRUCTURE UTILISATEURS ET SESSIONS (Instanciable)
-- ============================================================================

-- Table des profils utilisateurs (lié à Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- table des session d'aventure
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mj_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(6) UNIQUE NOT NULL,
    description TEXT,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.sessions TO authenticated;
GRANT UPDATE ON public.sessions TO authenticated;

CREATE TABLE users_session (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (session_id, user_id)
);

GRANT SELECT, INSERT ON public.users_session TO authenticated;
GRANT UPDATE ON public.users_session TO authenticated;

-- ============================================================================
-- 3. ENTITÉS DYNAMIQUES ET COMPTEURS (Données joueurs)
-- ============================================================================

-- Table principale des Personnages (Exempt de toute transitivité - 3FN)
CREATE TABLE characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Liens vers les objets session et utilisateur
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    -- On considère qu'un personnage appartient à une seule session
    -- et ne peut pas être "orphelin", d'où la contrainte NOT NULL.
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,

    -- nom du personnage et race, le nom est indexé pour les recherches rapides
    -- la race est un ENUM pour éviter les erreurs de saisie
    name VARCHAR(100) NOT NULL,
    race VARCHAR(20) NOT NULL CHECK (race IN ('elfe', 'halfling', 'humain', 'nain')),
    gender VARCHAR(10) NOT NULL DEFAULT 'masculin' CHECK (gender IN ('masculin', 'féminin')),
    -- Carrière actuelle du personnage, avec une contrainte de non-nullité
    career_id UUID REFERENCES careers(id) NOT NULL,
    
    -- Compteurs dynamiques fluctuants
    -- Les statistiques des caractéristiques sont stockées dans une table séparée en N-à-N.
    pv_max INT NOT NULL CHECK (pv_max >= 0),
    pv_current INT NOT NULL CHECK (pv_current >= 0),
    destiny_current INT NOT NULL CHECK (destiny_current >= 0),
    -- Exception les points de fortune sont stockés ici.
    fortune_max INT NOT NULL CHECK (fortune_max >= 0),
    fortune_current INT NOT NULL CHECK (fortune_current >= 0),
    
    -- Expérience
    xp_total INT DEFAULT 0 NOT NULL CHECK (xp_total >= 0),
    xp_available INT DEFAULT 0 NOT NULL CHECK (xp_available >= 0),
    
    -- Monnaie
    money_gold INT DEFAULT 0 NOT NULL CHECK (money_gold >= 0),
    money_silver INT DEFAULT 0 NOT NULL CHECK (money_silver >= 0),
    money_copper INT DEFAULT 0 NOT NULL CHECK (money_copper >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes d'intégrité pour éviter les incohérences de données
    CONSTRAINT check_pv_bounds CHECK (pv_current <= pv_max),
    CONSTRAINT check_fortune_bounds CHECK (fortune_current <= fortune_max),
    CONSTRAINT check_xp_bounds CHECK (xp_available <= xp_total),
    CONSTRAINT check_money_bounds CHECK (money_copper >= 0 AND money_silver >= 0 AND money_gold >= 0)
);

  CREATE UNIQUE INDEX IF NOT EXISTS characters_unique_session_user_idx
    ON public.characters (session_id, user_id);

-- Table des valeurs de caractéristiques (Lien N à N strict entre Character et Stat)
CREATE TABLE character_stat_values (
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    stat_code VARCHAR(3) REFERENCES static_stats(code),
    base_value INT NOT NULL CHECK (base_value >= 0),
    -- Valeur améliorable via la carrière
    -- current advanced est la valeur actuelle, elle peut être supérieure au total_advanced selon la carrière choisie.
    -- total_advanced est la possibilité d'amélioration maximale selon la carrière choisie.
    current_advanced INT DEFAULT 0 NOT NULL CHECK (current_advanced >= 0),
    total_advanced INT DEFAULT 0 NOT NULL CHECK (total_advanced >= 0),
    PRIMARY KEY (character_id, stat_code)
);


-- ============================================================================
-- 4. TABLES DE LIAISON D'INVENTAIRE ET CAPACITÉS
-- ============================================================================

CREATE TABLE character_skills (
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    mastery_level INT DEFAULT 1 NOT NULL CHECK (mastery_level IN (1, 2, 3)), -- Évite la redondance textuelle
    PRIMARY KEY (character_id, skill_id)
);

CREATE TABLE character_talents (
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    talent_id UUID REFERENCES talents(id) ON DELETE CASCADE,
    PRIMARY KEY (character_id, talent_id)
);

CREATE TABLE character_weapons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    weapon_id UUID REFERENCES weapons(id) ON DELETE RESTRICT,
    quality VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (quality IN ('médiocre', 'normal', 'bonne', 'exceptionelle')),
    -- une arme peut être équipée à la main droite, gauche ou les deux (d&g). 
    -- Si c'est NULL, c'est que c'est dans l'inventaire
    equiped VARCHAR(6) CHECK (equiped IN ('droite', 'gauche', 'd&g'))
);

CREATE TABLE character_armors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    armor_id UUID REFERENCES armors(id) ON DELETE RESTRICT,
    quality VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (quality IN ('médiocre', 'normal', 'bonne', 'exceptionelle')),
    is_equipped BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE character_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
    quality VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (quality IN ('médiocre', 'normal', 'bonne', 'exceptionelle')),
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0)
);

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receiver_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

create table session_notes (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  author_user_id uuid references profiles(id) on delete set null,

  title varchar(200) not null,

  -- Colonnes par type de contenu (une seule table)
  content_text text,
  content_character_note text,
  content_image_path text, -- reserve pour M2

  is_visible boolean not null default false,
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Au moins un contenu
  constraint session_notes_has_content check (
    coalesce(length(trim(content_text)), 0) > 0
    or coalesce(length(trim(content_character_note)), 0) > 0
    or coalesce(length(trim(content_image_path)), 0) > 0
  )
);

create index session_notes_session_created_idx
  on session_notes(session_id, created_at desc);

grant select, insert, update, delete on public.session_notes to authenticated;

-- Realtime Supabase pour les notes de session.
-- REPLICA IDENTITY FULL permet de recevoir les anciennes valeurs sur UPDATE/DELETE.
alter table public.session_notes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'session_notes'
  ) then
    alter publication supabase_realtime add table public.session_notes;
  end if;
end
$$;


-- Ajout des règles, données, compétences et des talents présents dans les règles de Warhammer 2ème édition.

-- Statistique s de base et secondaires, ne peuvent être modifiées par personne, sauf eventuellement l'administrateur.
INSERT INTO static_stats (code, name, is_secondary) VALUES
    ('CC', 'Capacité de Combat', FALSE),
    ('CT', 'Capacité de Tir', FALSE),
    ('F', 'Force', FALSE),
    ('E', 'Endurance', FALSE),
    ('Ag', 'Agilité', FALSE),
    ('Int', 'Intelligence', FALSE),
    ('FM', 'Force Mentale', FALSE),
    ('Soc', 'Sociabilité', FALSE),
    ('A', 'Attaque', TRUE),
    ('B', 'Blessures', TRUE),
    ('M', 'Mouvement', TRUE),
    ('Mag', 'Magie', TRUE)
    ON CONFLICT DO NOTHING;

-- Compétences des règles de Warhammer, ne peuvent pas être modifiées, sauf par l'administrateur.
INSERT INTO skills (name, specialization, stat_code, description, is_basic) VALUES
    ('Alphabet secret', 'astrologie', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les astrologues.', FALSE),
    ('Alphabet secret', 'culte de l''illumination', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les adeptes du culte de l''illumination.', FALSE),
    ('Alphabet secret', 'pisteur', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les pisteurs.', FALSE),
    ('Alphabet secret', 'voleur', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les voleurs.', FALSE),
    ('Alphabet secret', 'rôdeur', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les rôdeurs.', FALSE),
    ('Alphabet secret', 'templier', 'Int', 'Permet de lire et d''écrire dans un alphabet secret utilisé par les templiers.', FALSE),
    ('Baratin', NULL, 'Soc', 'Gagner du temps en baratinant un interlocuteur avec un discours non rationnel. Victimes ont droit à un test de FM pour percer la ruse. Non utilisable en combat. Touche 1 personne / tranche de 10 points en Soc.', FALSE),
    ('Braconnage', NULL, 'Ag', 'Poser des pièges et appâter afin d''attraper des animaux. 1 test/jour/piège, la réussite indique qu''une créature a été capturée.', FALSE),
    ('Canotage', NULL, 'F', 'Ramer et diriger une embarcation. Test en cas de conditions difficiles.', TRUE),
    ('Charisme', NULL, 'Soc', 'Tests de Charisme : solliciter la sympathie, la bonne volonté, l''aide ou la miséricorde d''un PNJ. Tests de Bluff : raconter un mensonge convaincant ou paraître innocent quand on est coupable. Victimes ont droit à un test de FM si ordre inhabituel. Touche 1 personne / tranche de 10 points en Soc.', TRUE),
    ('Commandement', NULL, 'Soc', 'Amener des subalternes à exécuter des ordres. En cas d''échec du test, les subalternes font n''importe quoi ou rien du tout.', TRUE),
    ('Commérage', NULL, 'Soc', 'Tests de Commérage : récupérer les rumeurs locales auprès d''un groupe de PNJ en quelques heures. Tests de Renseignement : obtenir une information précise d''un PNJ lors d''une conversation.', TRUE),
    ('Conduite d''attelage', NULL, 'F', 'Conduire carrioles, charriots, char. Test en cas de conditions difficiles.', TRUE),
    ('Connaissance académiques', 'arts', 'Int', 'Connaissance des arts, de l''histoire, de la littérature et de la philosophie. Test pour reconnaître un style, un auteur ou une époque.', FALSE),
    ('Connaissance académiques', 'astronomie', 'Int', 'Connaissance des astres, des planètes et de leurs mouvements. Test pour reconnaître une constellation ou un phénomène céleste.', FALSE),
    ('Connaissance académiques', 'démonologie', 'Int', 'Connaissance des démons, de leurs hiérarchies et de leurs pouvoirs. Test pour identifier un démon ou un rituel démoniaque.', FALSE),
    ('Connaissance académiques', 'géographie', 'Int', 'Connaissance des régions, des pays et de leurs caractéristiques. Test pour situer un lieu ou une ville.', FALSE),
    ('Connaissance académiques', 'histoire', 'Int', 'Connaissance des événements passés, des guerres et des personnages historiques. Test pour dater un événement ou identifier un personnage historique.', FALSE),
    ('Connaissance académiques', 'droit', 'Int', 'Connaissance des lois, des coutumes et des règles juridiques. Test pour interpréter une loi ou un contrat.', FALSE),
    ('Connaissance académiques', 'esprit', 'Int', 'Connaissance des esprits, des fantômes et des phénomènes paranormaux. Test pour identifier un esprit ou un rituel spirituel.', FALSE),
    ('Connaissance académiques', 'généalogie/héraldique', 'Int', 'Connaissance des familles, des lignées et des armoiries. Test pour identifier une famille ou un blason.', FALSE),
    ('Connaissance académiques', 'ingénierie', 'Int', 'Connaissance des machines, des constructions et des techniques d''ingénierie. Test pour comprendre un mécanisme ou un plan.', FALSE),
    ('Connaissance académiques', 'loi', 'Int', 'Connaissance des lois, des coutumes et des règles juridiques. Test pour interpréter une loi ou un contrat.', FALSE),
    ('Connaissance académiques', 'magie', 'Int', 'Connaissance des sorts, des rituels et des traditions magiques. Test pour identifier un sort ou un rituel.', FALSE),
    ('Connaissance académiques', 'nécromancie', 'Int', 'Connaissance des morts, des revenants et des pratiques nécromantiques. Test pour identifier un rituel nécromantique ou un revenant.', FALSE),
    ('Connaissance académiques', 'philosophie', 'Int', 'Connaissance des idées, des courants de pensée et des philosophes. Test pour interpréter une idée ou un texte philosophique.', FALSE),
    ('Connaissance académiques', 'runes', 'Int', 'Connaissance des runes, de leur signification et de leur utilisation. Test pour identifier une rune ou un symbole.', FALSE),
    ('Connaissance académiques', 'science', 'Int', 'Connaissance des sciences, des phénomènes naturels et des lois de la nature. Test pour expliquer un phénomène ou une expérience scientifique.', FALSE),
    ('Connaissance académiques', 'stratégie/tactique', 'Int', 'Connaissance des plans militaires, des batailles et des tactiques. Test pour élaborer une stratégie ou analyser une bataille.', FALSE),
    ('Connaissance académiques', 'théologie', 'Int', 'Connaissance des religions, des dieux et des pratiques religieuses. Test pour interpréter un texte religieux ou identifier un rituel.', FALSE),
    ('Connaissance générales', 'Bretonnie', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de la Bretonnie. Test pour situer un lieu ou identifier une tradition bretonnienne.', FALSE),
    ('Connaissance générales', 'Désolation du Chaos', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de la Désolation du Chaos. Test pour situer un lieu ou identifier une tradition chaotique.', FALSE),
    ('Connaissance générales', 'Empire', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de l''Empire. Test pour situer un lieu ou identifier une tradition impériale.', FALSE),
    ('Connaissance générales', 'Estalie', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de l''Estalie. Test pour situer un lieu ou identifier une tradition estalienne.', FALSE),
    ('Connaissance générales', 'Kislev', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de Kislev. Test pour situer un lieu ou identifier une tradition kislevite.', FALSE),
    ('Connaissance générales', 'Norsca', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de Norsca. Test pour situer un lieu ou identifier une tradition norsca.', FALSE),
    ('Connaissance générales', 'Ogre', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Ogres. Test pour situer un lieu ou identifier une tradition ogre.', FALSE),
    ('Connaissance générales', 'Tilée', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de Tilée. Test pour situer un lieu ou identifier une tradition tiléenne.', FALSE),
    ('Connaissance générales', 'Cathay', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de Cathay. Test pour situer un lieu ou identifier une tradition cathayenne.', FALSE),
    ('Connaissance générales', 'Elfes', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Elfes. Test pour situer un lieu ou identifier une tradition elfique.', FALSE),
    ('Connaissance générales', 'Nains', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Nains. Test pour situer un lieu ou identifier une tradition naine.', FALSE),
    ('Connaissance générales', 'Skavens', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Skavens. Test pour situer un lieu ou identifier une tradition skaven.', FALSE),
    ('Connaissance générales', 'Hommes-bêtes', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Hommes-bêtes. Test pour situer un lieu ou identifier une tradition hommes-bêtes.', FALSE),
    ('Connaissance générales', 'Vampires', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Vampires. Test pour situer un lieu ou identifier une tradition vampirique.', FALSE),
    ('Connaissance générales', 'Morts-vivants', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Morts-vivants. Test pour situer un lieu ou identifier une tradition nécromantique.', FALSE),
    ('Connaissance générales', 'Halflings', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Halflings. Test pour situer un lieu ou identifier une tradition halfling.', FALSE),
    ('Connaissance générales', 'Principautés Frontalières', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Principautés Frontalières. Test pour situer un lieu ou identifier une tradition frontalière.', FALSE),
    ('Connaissance générales', 'Marienburg', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes de Marienburg. Test pour situer un lieu ou identifier une tradition marienburgeoise.', FALSE),
    ('Connaissance générales', 'Pays Perdu', 'Int', 'Connaissance de la géographie, de l''histoire et des coutumes des Pays Perdus. Test pour situer un lieu ou identifier une tradition perdue.', FALSE),
    ('Création de runes', NULL, 'Int', 'Créer des runes magiques sur des objets ou des surfaces. Test pour réussir à graver une rune correctement.', FALSE),
    ('Crochetage', NULL, 'Ag', 'Ouvrir des serrures sans la clé. Test pour réussir à crocheter une serrure.', FALSE),
    ('Déguisement', NULL, 'Int', 'Se déguiser pour tromper les autres. Test pour réussir à passer inaperçu ou à incarner un personnage.', TRUE),
    ('Déplacement silencieux', NULL, 'Ag', 'Se déplacer sans faire de bruit. Test pour réussir à se déplacer discrètement.', TRUE),
    ('Dissimulation', NULL, 'Soc', 'Se cacher de ces ennemis. Le terrain doit présenter un endroit pour se cacher (arbre, mur, bâtiment, …).', TRUE),
    ('Dressage', NULL, 'Soc', 'Entraîner les animaux à faire des tours et obéir ordres simples. 1 test si tour simple, 3 si moyennement difficile, 10 si difficile.', TRUE),
    ('Emprise sur les animaux', NULL, 'Soc', 'Influencer le comportement d''un animal. Test pour calmer un animal agressif ou le faire obéir.', FALSE),
    ('Équitation', NULL, 'Ag', 'Monter et diriger un cheval ou une monture. Test en cas de conditions difficiles.', TRUE),
    ('Escalade', NULL, 'F', 'Grimper sur des surfaces verticales ou escarpées. Test pour réussir à atteindre un point élevé.', TRUE),
    ('Escamotage', NULL, 'Ag', 'Faire disparaître un objet de la vue d''autrui. Test pour réussir à escamoter un objet sans être vu.', TRUE),
    ('Esquive', NULL, 'Ag', 'Éviter une attaque ou un danger. Test pour réussir à esquiver un coup. Limité à une esquive par round.', FALSE),
    ('Évaluation', NULL, 'Int', 'Évaluer la valeur d''un objet ou d''une situation. Test pour estimer correctement la valeur d''un objet ou la gravité d''une situation.', TRUE),
    ('Expression artistique', 'acrobate', 'Int', 'Acrobatie pour divertir un groupe de spectateurs.', FALSE),
    ('Expression artistique', 'acteur', 'Int', 'Interprétation d''un rôle pour divertir un public.', FALSE),
    ('Expression artistique', 'danseur', 'Int', 'Danse pour divertir un public ou un groupe de spectateurs.', FALSE),
    ('Expression artistique', 'bouffon', 'Int', 'Faire rire un public ou un groupe de spectateurs par des pitreries ou des blagues.', FALSE),
    ('Expression artistique', 'musicien', 'Int', 'Jouer d''un instrument pour divertir un public ou un groupe de spectateurs.', FALSE),
    ('Expression artistique', 'chanteur', 'Int', 'Chanter pour divertir un public ou un groupe de spectateurs.', FALSE),
    ('Expression artistique', 'chiromancien', 'Int', 'Lire les lignes de la main pour prédire l''avenir ou révéler des traits de personnalité.', FALSE),
    ('Expression artistique', 'conteur', 'Int', 'Raconter des histoires pour divertir un public ou un groupe de spectateurs.', FALSE),
    ('Expression artistique', 'cracheur de feu', 'Int', 'Cracher du feu pour impressionner ou divertir un public.', FALSE),
    ('Expression artistique', 'illusionniste', 'Int', 'Créer des illusions visuelles pour tromper ou divertir un public.', FALSE),
    ('Expression artistique', 'jongleur', 'Int', 'Faire des tours de jonglerie pour divertir un public ou un groupe de spectateurs.', FALSE),
    ('Filature', NULL, 'Ag', 'Suivre discrètement une personne sans se faire remarquer. Test pour réussir à suivre quelqu''un sans être détecté.', FALSE),
    ('Focalisation', NULL, 'Int', 'Contrôler les vents de magie. Si utilisée et test réussi, bonus égal à la caractéristique Magie ajouté au jet d''incantation', FALSE),
    ('Fouille', NULL, 'Int', 'Chercher des objets cachés ou des passages secrets. Test pour réussir à trouver un objet ou un passage caché.', TRUE),
    ('Hypnotisme', NULL, 'FM', 'Influencer l''esprit d''une personne pour la contrôler ou la persuader. Test pour réussir à hypnotiser quelqu''un.', FALSE),
    ('Intimidation', NULL, 'Soc', 'Faire peur à quelqu''un pour le contraindre à agir d''une certaine manière. Test pour réussir à intimider quelqu''un.', TRUE),
    ('Jeu', NULL, 'Int', 'Jouer à des jeux de cartes ou de dés. Celui qui remporte le test gagne la partie.', TRUE),
    ('Langage mystique', 'demonik', 'Int', 'Lire et écrire le langage des démons. Test pour comprendre un texte démoniaque ou communiquer avec un démon.', FALSE),
    ('Langage mystique', 'magick', 'Int', 'Lire et écrire le langage des magiciens. Test pour comprendre un texte magique ou communiquer avec un magicien.', FALSE),
    ('Langage mystique', 'elfique', 'Int', 'Lire et écrire le langage des elfes. Test pour comprendre un texte elfique ou communiquer avec un elfe.', FALSE),
    ('Langage mystique', 'nain', 'Int', 'Lire et écrire le langage des nains. Test pour comprendre un texte nain ou communiquer avec un nain.', FALSE),
    ('Langage mystique', 'haut néhékharéen', 'Int', 'Lire et écrire le langage des anciens. Test pour comprendre un texte ancien ou communiquer avec un érudit.', FALSE),
    ('Langage secret', 'bataille', 'Int', 'Lire et écrire le langage secret des batailles. Test pour comprendre un message codé ou communiquer avec un soldat.', FALSE),
    ('Langage secret', 'culte', 'Int', 'Lire et écrire le langage secret des cultes. Test pour comprendre un message codé ou communiquer avec un adepte.', FALSE),
    ('Langage secret', 'guilde', 'Int', 'Lire et écrire le langage secret des guildes. Test pour comprendre un message codé ou communiquer avec un membre de guilde.', FALSE),
    ('Langage secret', 'voleur', 'Int', 'Lire et écrire le langage secret des voleurs. Test pour comprendre un message codé ou communiquer avec un voleur.', FALSE),
    ('Langage secret', 'rôdeur', 'Int', 'Lire et écrire le langage secret des rôdeurs. Test pour comprendre un message codé ou communiquer avec un rôdeur.', FALSE),
    ('Langue', 'bretonnien', 'Int', 'Parler et comprendre le bretonnien. Test pour communiquer avec un bretonnien ou comprendre un texte bretonnien.', FALSE),
    ('Langue', 'arabien', 'Int', 'Parler et comprendre l''arabien. Test pour communiquer avec un arabien ou comprendre un texte arabe.', FALSE),
    ('Langue', 'classique', 'Int', 'Parler et comprendre le classique. Test pour communiquer avec un érudit ou comprendre un texte classique.', FALSE),
    ('Langue', 'eltharin', 'Int', 'Parler et comprendre l''eltharin. Test pour communiquer avec un elfe ou comprendre un texte elfique.', FALSE),
    ('Langue', 'estalien', 'Int', 'Parler et comprendre l''estalien. Test pour communiquer avec un estalien ou comprendre un texte estalien.', FALSE),
    ('Langue', 'gobelinoïde', 'Int', 'Parler et comprendre le gobelinoïde. Test pour communiquer avec un gobelin ou comprendre un texte gobelin.', FALSE),
    ('Langue', 'grumbarth', 'Int', 'Parler et comprendre le grumbarth. Test pour communiquer avec un grumbarth ou comprendre un texte grumbarth.', FALSE),
    ('Langue', 'halfling', 'Int', 'Parler et comprendre le halfling. Test pour communiquer avec un halfling ou comprendre un texte halfling.', FALSE),
    ('Langue', 'khazalid', 'Int', 'Parler et comprendre le langage des nains. Test pour communiquer avec un nain ou comprendre un texte nain.', FALSE),
    ('Langue', 'reikspiel', 'Int', 'Parler et comprendre le reikspiel. Test pour communiquer avec un impérial ou comprendre un texte impérial.', FALSE),
    ('Langue', 'tiléen', 'Int', 'Parler et comprendre le tiléen. Test pour communiquer avec un tiléen ou comprendre un texte tiléen.', FALSE),
    ('Langue', 'norse', 'Int', 'Parler et comprendre le norse. Test pour communiquer avec un norsque ou comprendre un texte norsque.', FALSE),
    ('Langue', 'kislevien', 'Int', 'Parler et comprendre le kislevien. Test pour communiquer avec un kislevite ou comprendre un texte kislevien.', FALSE),
    ('Langue', 'langage sombre', 'Int', 'Parler et comprendre le langage sombre. Test pour communiquer avec un serviteur du Chaos ou comprendre un texte chaotique.', FALSE),
    ('Lecture sur les lèvres', NULL, 'Int', 'Comprendre ce que quelqu''un dit en observant ses lèvres. Test pour réussir à lire sur les lèvres d''une personne.', FALSE),
    ('Lire/Écrire', NULL, 'Int', 'Lire et écrire dans la ou les langues parlées. Le test n''est nécessaire que quand le texte est difficile à comprendre ou écrit dans un style particulier.', FALSE),
    ('Marchandage', NULL, 'Soc', 'Négocier le prix d''un objet ou d''un service. Test pour obtenir un meilleur prix ou une meilleure offre.', TRUE),
    ('Métier', 'aphoticaire', 'Int', 'Connaissance des herbes, des potions et des remèdes. Test pour préparer une potion ou un remède.', FALSE),
    ('Métier', 'brasseur', 'Int', 'Connaissance de la fabrication de la bière et des boissons fermentées. Test pour brasser une boisson de qualité.', FALSE),
    ('Métier', 'charpentier naval', 'Int', 'Connaissance de la construction et de la réparation des navires. Test pour construire ou réparer un navire.', FALSE),
    ('Métier', 'cuisiner', 'Int', 'Connaissance de la préparation des repas et des techniques culinaires. Test pour préparer un repas de qualité.', FALSE),
    ('Métier', 'embaumeur', 'Int', 'Connaissance des techniques d''embaumement et de préservation des corps. Test pour embaumer un corps correctement.', FALSE),
    ('Métier', 'herboriste', 'Int', 'Connaissance des plantes médicinales et de leurs usages. Test pour identifier une plante ou préparer un remède.', FALSE),
    ('Métier', 'marchand', 'Soc', 'Connaissance du commerce, des prix et des techniques de vente. Test pour réussir une transaction ou négocier un prix.', FALSE),
    ('Métier', 'fauconnier', 'Soc', 'Connaissance de l''entraînement et de l''utilisation des faucons. Test pour entraîner un faucon ou le faire chasser.', FALSE),
    ('Métier', 'garçon d''écurie', 'Soc', 'Connaissance des soins aux chevaux et de l''entretien des écuries. Test pour soigner un cheval ou entretenir une écurie.', FALSE),
    ('Métier', 'maitre chien', 'Soc', 'Connaissance de l''entraînement et de l''utilisation des chiens. Test pour entraîner un chien ou le faire obéir.', FALSE),
    ('Métier', 'marchand de chevaux', 'Soc', 'Connaissance de l''achat, de la vente et de l''entretien des chevaux. Test pour évaluer un cheval ou négocier un prix.', FALSE),
    ('Métier', 'arquebusier', 'Ag', 'Connaissance de l''utilisation et de l''entretien des armes à feu. Test pour tirer avec précision ou entretenir une arquebuse.', FALSE),
    ('Métier', 'artiste', 'Ag', 'Connaissance des techniques artistiques et de la création d''œuvres. Test pour créer une œuvre d''art ou exécuter une performance.', FALSE),
    ('Métier', 'calligraphe', 'Ag', 'Connaissance de l''écriture et de la calligraphie. Test pour écrire avec élégance ou créer un document officiel.', FALSE),
    ('Métier', 'cartographe', 'Ag', 'Connaissance de la cartographie et de la création de cartes. Test pour dessiner une carte précise ou interpréter une carte existante.', FALSE),
    ('Métier', 'charpentier', 'Ag', 'Connaissance de la construction et de la réparation des structures en bois. Test pour construire ou réparer une structure en bois.', FALSE),
    ('Métier', 'cordonnier', 'Ag', 'Connaissance de la fabrication et de la réparation des chaussures. Test pour fabriquer ou réparer une paire de chaussures.', FALSE),
    ('Métier', 'cristallier', 'Ag', 'Connaissance de la taille et de la gravure du cristal. Test pour tailler ou graver un objet en cristal.', FALSE),
    ('Métier', 'fabricant d''arc', 'Ag', 'Connaissance de la fabrication et de l''entretien des arcs. Test pour fabriquer ou entretenir un arc.', FALSE),
    ('Métier', 'fabricant de bougie', 'Ag', 'Connaissance de la fabrication et de l''entretien des bougies. Test pour fabriquer ou entretenir une bougie.', FALSE),
    ('Métier', 'maçon', 'Ag', 'Connaissance de la construction et de la réparation des structures en pierre. Test pour construire ou réparer une structure en pierre.', FALSE),
    ('Métier', 'orfèvre', 'Ag', 'Connaissance de la fabrication et de la gravure des objets en métal précieux. Test pour fabriquer ou graver un objet en or ou en argent.', FALSE),
    ('Métier', 'tailleur', 'Ag', 'Connaissance de la fabrication et de la réparation des vêtements. Test pour fabriquer ou réparer un vêtement.', FALSE),
    ('Métier', 'fabricant d''armes', 'F', 'Connaissance de la fabrication et de l''entretien des armes. Test pour fabriquer ou entretenir une arme.', FALSE),
    ('Métier', 'fabricant d''armures', 'F', 'Connaissance de la fabrication et de l''entretien des armures. Test pour fabriquer ou entretenir une armure.', FALSE),
    ('Métier', 'fermier', 'F', 'Connaissance de l''agriculture et de l''élevage. Test pour cultiver des plantes ou élever des animaux.', FALSE),
    ('Métier', 'forgeron', 'F', 'Connaissance de la forge et de la fabrication d''objets en métal. Test pour forger un objet ou réparer un outil.', FALSE),
    ('Métier', 'meunier', 'F', 'Connaissance de la mouture et de la fabrication de farine. Test pour moudre du grain ou entretenir un moulin.', FALSE),
    ('Métier', 'mineur', 'F', 'Connaissance de l''extraction et de la transformation des minéraux. Test pour extraire un minerai ou entretenir une mine.', FALSE),
    ('Métier', 'prospecteur', 'F', 'Connaissance de la recherche et de l''exploitation des ressources naturelles. Test pour trouver un gisement ou évaluer une ressource.', FALSE),
    ('Métier', 'tanneur', 'F', 'Connaissance du traitement et de la transformation des peaux. Test pour tanner une peau ou fabriquer un objet en cuir.', FALSE),
    ('Métier', 'tonnelier', 'F', 'Connaissance de la fabrication et de l''entretien des tonneaux. Test pour fabriquer ou entretenir un tonneau.', FALSE),
    ('Natation', NULL, 'F', 'Nager dans l''eau. Test pour réussir à nager sur une certaine distance ou dans des conditions difficiles.', FALSE),
    ('Navigation', NULL, 'Int', 'Se repérer et diriger un navire en mer. Test pour réussir à naviguer ou à éviter les dangers maritimes.', FALSE),
    ('Orientation', NULL, 'Int', 'Se repérer dans un environnement inconnu. Test pour réussir à trouver son chemin ou à éviter de se perdre.', FALSE),
    ('Perception', NULL, 'Int', 'Permet d''observer l''environnement pour y déceler des détails qui passeraient normalement inaperçus. Sert à déceler les pièges, fosses et autres dangers physiques. Perception recouvre tous les sens. Peut aussi être utilisée pour estimer des quantités, des distances, ...', TRUE),
    ('Pistage', NULL, 'Int', 'Permet de suivre les traces d''une créature ou d''une personne. Test pour réussir à suivre une piste ou identifier des indices.', FALSE),
    ('Préparation des poisons', NULL, 'Int', 'Connaissance de la préparation et de l''utilisation des poisons. Test pour préparer un poison ou identifier un poison.', FALSE),
    ('Résistance à l''alcool', NULL, 'E', 'Résister aux effets de l''alcool. Les règles de l''alcool sont décris dans le livre de règles. Test de compétence après chaque verre qui excède le BE.', TRUE),
    ('Sens de la magie', NULL, 'Mag', 'Permet de détecter la présence de magie dans un objet ou un lieu. Test pour réussir à percevoir la magie.', FALSE),
    ('Soins', NULL, 'Int', 'Permet de soigner les blessures. Si le test est réussi, permet de soigner 1d10 points de blessures, 1 point si gravement blessé.', FALSE),
    ('Soins des animaux', NULL, 'Int', 'Permet de prendre soin des animaux domestiques et de la ferme. Test pour déceler des maladies ou des signes de gêne.', FALSE),
    ('Survie', NULL, 'Int', 'Permet de survivre dans la nature (chasse, pêche, feu, abri…).', TRUE),
    ('Torture', NULL, 'Soc', 'Permet d''obtenir des informations par la torture. Test pour réussir à faire parler quelqu''un.', FALSE),
    ('Ventriloquie', NULL, 'Soc', 'Permet de faire parler une marionnette ou de faire croire que la voix vient d''ailleurs. Test pour réussir à tromper quelqu''un avec la ventriloquie.', FALSE)
    ON CONFLICT DO NOTHING;

-- Talents des règles de Warhammer, ne peuvent pas être modifiés, sauf par l'administrateur.
INSERT INTO talents (name, description, specialization) VALUES
    ('Acrobatie équestre', 'Equitation +10%', NULL),
    ('Acuité auditive', 'Perception des sons +20%', NULL),
    ('Acuité visuelle', 'Perception visuelle +10%', NULL),
    ('Adresse au tir', 'Action viser +20% CT', NULL),
    ('Affinité provinciale', 'Bonus de +10% aux tests de connaissance générale sur la province d''origine du personnage', NULL),
    ('Ambidextre', 'Permet de ne pas subir le malus de -20% en CC à la main non directrice', NULL),
    ('Amphibie', 'Immunisé à la noyade, pas de malus à la natation', NULL),
    ('Armes naturelles', 'Lorsque vous vous battez à mains nues, vous comptez comme étant armé d''une arme à une main. Vous ne pouvez pas parer ni être désarmé.', NULL),
    ('Art de la mort silencieuse', 'Dégâts mains nues = BF-3 et les points d''armure ne comptent pas double.', NULL),
    ('Aura démoniaque', 'BE +2 contre les armes non magiques, les attaques sont magiques, Immunisé contre le poison et l''asphyxie', NULL),
    ('Calcul mental', 'Jeu & Orientation +10%, Perception (estimation) +20%', NULL),
    ('Camouflage rural', 'Déplacement silencieux (rural) +10%, Dissimulation (rural) +10%', NULL),
    ('Camouflage souterrain', 'Déplacement silencieux (souterrain) +10%, Dissimulation (souterrain) +10%', NULL),
    ('Camouflage urbain', 'Déplacement silencieux (urbain) +10%, Dissimulation (urbain) +10%', NULL),
    ('Chance', 'Vous êtes chanceux. Cela ajoute 1 point de fortune par jour.', NULL),
    ('Chirurgie', 'Soins +10%, soins sur personnages Gravement blessé +1, Test pour éviter amputation +20%', NULL),
    ('Code de la rue', 'Charisme et Commérage +10% pour les interactions avec la pègre', NULL),
    ('Combat de rue', '+10% en CC et dégâts augmenté de 1 pour les attaques à mains nues.', NULL),
    ('Combattant virevoltant', 'Action de saut à 1/2 action et portée des sauts +1', NULL),
    ('Connaissances des pièges', 'Crochetage +10%, Perception +10% pour détecter les pièges', NULL),
    ('Contorsioniste', 'Expression artistique (contorsion) +10%', NULL),
    ('Coup assomant', 'Vous pouvez tenter d''assommer votre adversaire au lieu d''infliger des dégâts. Vous devez d''abord effectuer un test de Force. Si réussi, votre adversaire fait un test d''Endurance (+10%/PA à la tête). S''il échoue, assommé pendant 1D10 rounds', NULL),
    ('Coup précis', 'Coup critique +1', NULL),
    ('Coup puissant', 'Dégâts +1 pour les attaques à mains nues et armes à une main', NULL),
    ('Course à pied', 'Valeur de mouvement +1', NULL),
    ('Désarmement', 'Quand vous réussissez une attaque au corps à corps, vous pouvez tenter de désarmer votre adversaire au lieu d''infliger des dégâts. Test d''Agilité opposé nécessaire.', NULL),
    ('Don du sang', 'Les dons du sang sont les pouvoirs qu''un mortel acquière quand il devient Vampire. Les règles sont expliquées dans le tome dédié aux vampires', NULL),
    ('Dur à cuire', 'Blessures +1', NULL),
    ('Dur en affaire', 'Evaluation +10%, Marchandage +10%', NULL),
    ('Effrayant', 'Vous provoquez la peur', NULL),
    ('Eloquence', 'Charisme amélioré, peut toucher x10 personnes', NULL),
    ('Etiquette', 'Charisme et Commérage +10% pour les interactions avec la noblesse', NULL),
    ('Force accrue', '+5% en Force', NULL),
    ('Frénésie', 'Vous devez passer 1 round à vous mettre en condition puis F et FM +10% et CC et Int -10%, pas de parade ni d''esquive', NULL),
    ('Fuite', 'Mouvement +1 pour les actions de fuite pendant 1d10 rounds', NULL),
    ('Fureur vengeresse', 'CC +5% en affrontant des orc/gobelin/ hobgobelin', NULL),
    ('Grand voyageur', 'Connaissance générale +10%, Langue +10%', NULL),
    ('Guerrier né', 'CC +5%', NULL),
    ('Harmonie Aetheryque', 'Focalisation +10%, Sens de la magie +10%', NULL),
    ('Imitation', 'Déguisement (voix) +10%, Langue (accent) +10%, Expression artistique (acteur, bouffon, clown, comédien et conteur) +10%', NULL),
    ('Incantation', 'Si vous réussissez un test d''Expression artistique (chanteur) et continuez à chanter tout au long du rituel, un lanceur de sorts allié bénéficie d''un bonus de +1 au jet d''incantation. Il peut y avoir autant d''individus apportant leur aide de cette façon que de lanceurs de sorts participant au rituel.', NULL),
    ('Incantation de bataille', 'Supprime le malus de porte d''armure pour les jets d''incation jusqu''à 3 points', NULL),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Manann', 'Manann'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Morr', 'Morr'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Myrmidia', 'Myrmidia'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Ranald', 'Ranald'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Sigmar', 'Sigmar'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Shallya', 'Shallya'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Taal/Rhya', 'Taal/Rhya'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Ulric', 'Ulric'),
    ('Inspiration divine', 'Vous pouvez lancer n''importe quel sort pour le dieu Verena', 'Verena'),
    ('Intelligent', 'Int +5%', NULL),
    ('Intrigant', 'Charisme (Intrigues) +10%, Test de FM contre Charisme +10%', NULL),
    ('Lévitation', 'Vous pouvez voler sur une courte distance au-dessus du sol.', NULL),
    ('Linguistique', 'Lire/Ecrire +10%, Langue +10%', NULL),
    ('Lutte', 'CC (mains nues) +10% , Test de F (prise) +10%', NULL),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (chaos).', 'chaos'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (divine).', 'divine'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (glace).', 'glace'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (occulte).', 'occulte'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (vedma).', 'vedma'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (vulgaire).', 'vulgaire'),
    ('Maîtrise de la magie', 'Vous pouvez lancer n''importe quel sort de magie commune (warp).', 'warp'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Manipulation distante', 'Manipulation distante'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Armure aethyrique', 'Armure aethyrique'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Arme consacrée', 'Arme consacrée'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Verrou magique', 'Verrou magique'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Alarme magique', 'Alarme magique'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Silence', 'Silence'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Marche dans les airs', 'Marche dans les airs'),
    ('Magie mineure', 'Vous maitrisez et pouvez lancer le sort : Dissipation', 'Dissipation'),
    ('Magie noire', 'Lancez 1D10 supplémentaire lors de vos jets d''incantation de « Magie noire ». Tous les dés sont comptabilisés pour la malédiction de Tzeentch.', NULL),
    ('Magie vulgaire', 'Vous pouvez lancer des sorts de « Magie commune » sans avoir la compétence « Langage mystique ». Vous devez cependant avoir le talent « Magie commune ». Tant que vous n''avez pas appris « Langage mystique », vous lancez 1D10 supplémentaire lors de vos incantations qui comptera uniquement pour la malédiction de Tzeentch.', NULL),
    ('Mains agiles', '+20% pour toucher en CC les sorts de contact', NULL),
    ('Maitre artilleur', '-1/2 action de rechargement pour les armes à poudre', NULL),
    ('Maitrise', 'Vous maitrisez les arbalètes', 'arbalètes'),
    ('Maitrise', 'Vous maitrisez les arcs longs', 'arcs longs'),
    ('Maitrise', 'Vous maitrisez les armes à deux mains', 'armes à deux mains'),
    ('Maitrise', 'Vous maitrisez les armes à feu', 'armes à feu'),
    ('Maitrise', 'Vous maitrisez les armes de cavaleries', 'armes de cavaleries'),
    ('Maitrise', 'Vous maitrisez les armes de jet', 'armes de jet'),
    ('Maitrise', 'Vous maitrisez les armes de parade', 'armes de parade'),
    ('Maitrise', 'Vous maitrisez les armes d''escrime', 'armes d''escrime'),
    ('Maitrise', 'Vous maitrisez les armes mécaniques', 'armes mécaniques'),
    ('Maitrise', 'Vous maitrisez les armes paralysantes', 'armes paralysantes'),
    ('Maitrise', 'Vous maitrisez les faux', 'faux'),
    ('Maitrise', 'Vous maitrisez les fléaux', 'fléaux'),
    ('Maitrise', 'Vous maitrisez le marteau du loup blanc', 'marteau du loup blanc'),
    ('Maitrise', 'Vous maitrisez les lance-pierres.', 'lance-pierres'),
    ('Méditation', 'Quand vous pratiquez la magie rituelle, vous bénéficiez au jet d''incantation d''un bonus égal à votre caractéristique de Magie', NULL),
    ('Menaçant', 'Intimidation +10%, Torture +10%', NULL),
    ('Mort vivant', 'Immunisé à la Peur, la Terreur, les coups assommants, le poison, les maladies et aux manipulations des émotions et de l''esprit', NULL),
    ('Orateur né', 'Évolution du talent Éloquence, porte à x100 le nombre de personne dans les jets de Charisme', NULL),
    ('Parade éclair', 'Quand vous effectuez une attaque rapide, vous pouvez renoncer à une attaque pour une parade. La limite d''1par/round doit être respectée', NULL),
    ('Politique', 'Baratin +10%, Charisme +10%, Marchandage +10%', NULL),
    ('Projectile puissant', 'Dégâts des projectiles magiques +1', NULL),
    ('Puissance imparable', '-30% pour parer les attaques de ce personnage', NULL),
    ('Rechargement rapide', 'Rechargement des armes à distance réduit d''1/2 action', NULL),
    ('Réflexes éclairs', 'Agilité +5%', NULL),
    ('Résistance accrue', 'Endurance +5%', NULL),
    ('Résistance à la magie', 'Test de FM contre Magie +10%', NULL),
    ('Résistance aux maladies', 'Immunisé aux maladies', NULL),
    ('Résistance aux poisons', 'Immunisé aux poisons', NULL),
    ('Robuste', 'Pas de malus en mouvement pour le port d''armure lourde', NULL),
    ('Sain d''esprit', 'Vous n''avez besoin d''effectuer de test de folie avant d''avoir 8 PF et pas de gain automatique avant 14 PF.', NULL),
    ('Sang-froid', 'FM +5%', NULL),
    ('Sans peur', 'Immunisé aux tests de Peur/Intimidation/Troublant. Terreur traitée comme Peur', NULL),
    ('Savoir faire nain', 'Métier (arquebusier, brasseur, cristallier, fabricant d''armes, fabricant d''armures, forgeron, maçon et mineur) +10%', NULL),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : bête', 'bête'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : cieux', 'cieux'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : feu', 'feu'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : lumière', 'lumière'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : métal', 'métal'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : mort', 'mort'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : ombre', 'ombre'),
    ('Science de la magie', 'Permet de lancer les sorts du vent de magie : vie', 'vie'),
    ('Sens aiguisés', 'Perception +20%', NULL),
    ('Sens de l''orientation', 'Orientation +10%', NULL),
    ('Sixième sens', 'Quand le danger est proche, le MJ fait un test de FM secret. En cas de succès, il peut vous dire que vous avez un mauvais pressentiment.', NULL),
    ('Sociable', 'Sociabilité +5%', NULL),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : chaos', 'chaos'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : nains du chaos', 'nains du chaos'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : nécromancie', 'nécromancie'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : Nurgle', 'Nurgle'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : peste', 'peste'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : ruse', 'ruse'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : Slaanesh', 'Slaanesh'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : Tzeentch', 'Tzeentch'),
    ('Sombre savoir', 'Permet de lancer les sorts du vent de magie noir : Warp', 'Warp'),
    ('Sur ses gardes', 'Une fois par round, vous pouvez utiliser l''action ‘dégainer'' en tant qu''action gratuite.', NULL),
    ('Talents artistique', 'Métier +20%, Evaluation de l''art +20%', NULL),
    ('Terrifiant', 'Vous provoquez la Terreur', NULL),
    ('Tir de précision', 'Points d''Armure de la Cible -1', NULL),
    ('Tir en puissance', 'Dégâts +1 pour les attaques à distance', NULL),
    ('Tireur d''élite', 'CT +10%', NULL),
    ('Troublant', 'Vos ennemis doivent réussir un test de Force Mentale quand ils vous voient pour éviter de subir un malus de - 10% en Capacité de Combat et en Capacité de Tir. Ils peuvent retenter ce test à chaque round jusqu''à ce qu''ils le réussissent ou que vous soyez hors de vue', NULL),
    ('Valeureux', 'FM +10% contre Intimidation/Tests Peur/Terreur.', NULL),
    ('Vision nocturne', 'Vous voyez parfaitement clair dans l''obscurité naturelle jusqu''à une distance de 30 mètres. Au-delà de cette distance, vous voyez comme si vous étiez dans l''obscurité naturelle.', NULL),
    ('Vol', 'Vous savez voler, voir le livre de règles pour les détails.', NULL),
    ('Volonté de fer', 'Immunisé à la Peur, à la Terreur, à l''Intimidation et au talent Troublant', NULL)
    ON CONFLICT DO NOTHING;


-- Carrières de Warhammer, ne peuvent pas être modifiées, sauf par l'administrateur.
-- Liens de carrières, ne peuvent être modifiés, sauf par l'administrateur.

INSERT INTO careers (name) VALUES
    ('Abbe'),
    ('Abbe lanceur de sort'),
    ('Acolyte de Khorne'),
    ('Acolyte de Nurgle'),
    ('Acolyte de Slaanesh'),
    ('Acolyte de Tzeentch'),
    ('Agent du suaire'),
    ('Agitateur'),
    ('Allumeur de réverbères'),
    ('Ambassadeur'),
    ('Amiral'),
    ('Anachorete'),
    ('Ancien de village'),
    ('Apothicaire'),
    ('Apprenti Chaman'),
    ('Apprenti maitre des runes'),
    ('Apprenti Prophète Gris'),
    ('Apprenti Rebouteur'),
    ('Apprenti Rebouteur ordinaire'),
    ('Apprenti Sorcier'),
    ('Apprentie Sorcière'),
    ('Archer monté'),
    ('Argousin'),
    ('Aristocrate'),
    ('Arrimeur'),
    ('Artisan'),
    ('Aspirant champion'),
    ('Assassin'),
    ('Astrologue'),
    ('Ataman'),
    ('Aubergiste'),
    ('Baleinier'),
    ('Bandit de grand chemin'),
    ('Baron du crime'),
    ('Bateleur'),
    ('Batelier'),
    ('Bedeau'),
    ('Berger Gasconnais'),
    ('Berserk Norse'),
    ('Bestigor'),
    ('Bourgeois'),
    ('Bourreau'),
    ('Brute'),
    ('Bucheron'),
    ('Cadet'),
    ('Canonnier'),
    ('Capitaine'),
    ('Capitaine de navire'),
    ('Cataclyste'),
    ('Catéchiste'),
    ('Cavalcadour'),
    ('Cavalier ailé'),
    ('Cenobite'),
    ('Chaman'),
    ('Chaman Bray'),
    ('Chaman Bray de Khorne'),
    ('Champion'),
    ('Champion de justice'),
    ('Champion du Chaos'),
    ('Champion du Chaos Exalte'),
    ('Champion Hierogrammate'),
    ('Champion Homme-Bête'),
    ('Chantre'),
    ('Charbonnier'),
    ('Charlatan'),
    ('Chasseur'),
    ('Chasseur cornu'),
    ('Chasseur de primes'),
    ('Chasseur de Vampires'),
    ('Chef'),
    ('Chef de bande'),
    ('Chef de clan'),
    ('Chef de guerre'),
    ('Chef de meute'),
    ('Chevalier'),
    ('Chevalier de la quête'),
    ('Chevalier du cercle intérieur'),
    ('Chevalier du champ verdoyant'),
    ('Chevalier du Chaos'),
    ('Chevalier du corbeau'),
    ('Chevalier du Graal'),
    ('Chevalier du royaume'),
    ('Chevalier du soleil'),
    ('Chevalier errant'),
    ('Chevalier panthère'),
    ('Chiffonnier'),
    ('Chirurgien barbier'),
    ('Cocher'),
    ('Collecteur de taxes'),
    ('Combattant des tunnels'),
    ('Compagnon maitre des runes'),
    ('Compagnon Sorcier'),
    ('Comte Vampire'),
    ('Conducteur de bestiaux'),
    ('Contrebandier'),
    ('Contremaitre'),
    ('Coupe-jarret'),
    ('Coureur d''égouts'),
    ('Coureur nocturne'),
    ('Courtisan'),
    ('Courtisan des Principautés'),
    ('Croise'),
    ('Démagogue'),
    ('Diacre de la Peste'),
    ('Diestro Estalien'),
    ('Dresseur d''ours'),
    ('Duelliste'),
    ('Eclaireur'),
    ('Eclaireur (Créature)'),
    ('Ecorcheur d''âmes'),
    ('Ecumeur des marais'),
    ('Ecuyer'),
    ('Egoutier'),
    ('Embaumeur'),
    ('Emissaire Elfe'),
    ('Encenseur à Peste'),
    ('Envouteur'),
    ('Erudit'),
    ('Esclavagiste'),
    ('Esclave'),
    ('Escroc'),
    ('Espion'),
    ('Etudiant'),
    ('Exorciste'),
    ('Explorateur'),
    ('Fanatique'),
    ('Faussaire'),
    ('Femme-Médecine'),
    ('Flagellant'),
    ('Fossoyeur'),
    ('Fouet de Dieu'),
    ('Franc-archer'),
    ('Frère à la cape'),
    ('Garde'),
    ('Garde des profondeurs'),
    ('Garde du corps'),
    ('Garde noir'),
    ('Gardien du temple'),
    ('Gardien tribal'),
    ('Geôlier'),
    ('Gladiateur'),
    ('Gran Chaman Bray'),
    ('Gran Chaman Bray de Khorne'),
    ('Grand Chaman'),
    ('Grande griffe'),
    ('Grand maitre'),
    ('Grand prêtre'),
    ('Grand prêtre cloitré'),
    ('Grand prêtre ordinaire'),
    ('Grenouillère'),
    ('Guerrier des clans'),
    ('Guerrier du Chaos'),
    ('Héraut'),
    ('Herrimault'),
    ('Hierogrammate'),
    ('Homme d''armes'),
    ('Homme lige'),
    ('Hors-la-loi'),
    ('Ingénieur'),
    ('Ingénieur de siege'),
    ('Ingénieur du Chaos'),
    ('Initie'),
    ('Intendant'),
    ('Investigateur Vérénéen'),
    ('Joueur'),
    ('Kossar Kislevite'),
    ('Magister Vigilant'),
    ('Magus de Khorne'),
    ('Magus de Nurgle'),
    ('Magus de Slaanesh'),
    ('Magus de Tzeentch'),
    ('Maitre artisan'),
    ('Maitre assassin'),
    ('Maitre corrupteur'),
    ('Maitre de guilde'),
    ('Maitre des runes'),
    ('Maitre Hierogrammate'),
    ('Maitre mutateur'),
    ('Maitre rebouteur'),
    ('Maitre rebouteur ordinaire'),
    ('Maitre Sorcier'),
    ('Malandrin'),
    ('Maledictor'),
    ('Maquignon'),
    ('Maraudeur'),
    ('Marchand'),
    ('Maresquier'),
    ('Marin'),
    ('Matelot'),
    ('Matriarche Vedma'),
    ('Médecin'),
    ('Médiateur'),
    ('Ménestrel'),
    ('Mercanti'),
    ('Mercenaire'),
    ('Messager'),
    ('Métayer'),
    ('Milicien'),
    ('Mineur'),
    ('Moine'),
    ('Moine de la Peste'),
    ('Moine mendiant'),
    ('Moine mendiant lanceur de sort'),
    ('Monte en l''air'),
    ('Muletier'),
    ('Mystique'),
    ('Mystique Strigany'),
    ('Naufrageur'),
    ('Navigateur'),
    ('Noble'),
    ('Nomade de la steppe'),
    ('Officier en second'),
    ('Oracle'),
    ('Pamphlétaire'),
    ('Passeur'),
    ('Patrouilleur'),
    ('Patrouilleur fluvial'),
    ('Paysan'),
    ('Pécheur'),
    ('Pèlerin'),
    ('Pèlerin du graal'),
    ('Pèlerin exalte'),
    ('Pénitent'),
    ('Percepteur'),
    ('Pillard'),
    ('Pilleur de tombes'),
    ('Pisteur'),
    ('Pistolier'),
    ('Plaideur'),
    ('Politicien'),
    ('Porterune'),
    ('Prêtre'),
    ('Prêtre cloitré'),
    ('Prêtre consacré'),
    ('Prêtre consacré cloitré'),
    ('Prêtre consacré ordinaire'),
    ('Prêtre de la Peste'),
    ('Prêtre guerrier'),
    ('Prêtre ordinaire'),
    ('Prince des voleurs'),
    ('Prophète Gris'),
    ('Racketteur'),
    ('Raconteur'),
    ('Ramasseur de fumier'),
    ('Ramoneur'),
    ('Ratier'),
    ('Rebouteur'),
    ('Rebouteur ordinaire'),
    ('Receleur'),
    ('Régisseur'),
    ('Repurgateur'),
    ('Rodeur des Principautés'),
    ('Rodeur fantôme'),
    ('Sans-visage'),
    ('Scalde'),
    ('Scribe'),
    ('Seigneur des runes'),
    ('Seigneur Gris'),
    ('Seigneur Hierogrammate'),
    ('Seigneur Sorcier'),
    ('Seigneur Vampire'),
    ('Sentinelle Halfling'),
    ('Sergent'),
    ('Serviteur'),
    ('Skaven noir'),
    ('Soldat'),
    ('Sorcier de village'),
    ('Sorcier du clan Eshin'),
    ('Sorcière de glace'),
    ('Spadassin'),
    ('Staraja Vedma'),
    ('Streltsi'),
    ('Tchékiste'),
    ('Technomage'),
    ('Thaumaturge'),
    ('Tirailleur'),
    ('Tisseruine'),
    ('Trafiquant de cadavres'),
    ('Tueur de démons'),
    ('Tueur de géants'),
    ('Tueur de morts'),
    ('Tueur de trolls'),
    ('Vagabond'),
    ('Valet'),
    ('Vampire nouveau-né'),
    ('Vendeur de journaux'),
    ('Vermine de choc'),
    ('Vétéran'),
    ('Vierge de glace'),
    ('Vitki'),
    ('Voleur'),
    ('Yeoman')
    ON CONFLICT DO NOTHING;

-- TODO : Ajouter les liens de carrières

-- Ajout des équipements, armes et armures classiques de Warhammer.

-- Armes
INSERT INTO weapons (name, encumbrance, damage_formula)
SELECT base.name, base.encumbrance, base.damage_formula
FROM (
  VALUES
    ('Épée à deux mains', 200, 'BF'),
    ('Marteau à deux mains', 200, 'BF'),
    ('Hâche à deux mains', 200, 'BF'),
    ('Pic de guerre à deux mains', 200, 'BF'),
    ('Épée à une main', 50, 'BF'),
    ('Marteau à une main', 50, 'BF'),
    ('Hâche à une main', 50, 'BF'),
    ('Pic de guerre à une main', 50, 'BF'),
    ('Bâton', 50, 'BF-2'),
    ('Bouclier', 50, 'BF-2'),
    ('Brise-lame', 40, 'BF-3'),
    ('Dague', 10, 'BF-3'),
    ('Demi-lance', 75, 'BF'),
    ('Fléau d''armes', 95, 'BF+1'),
    ('Fleuret', 40, 'BF-2'),
    ('Gantelet/coup-de-poing', 1, 'BF-3'),
    ('Hallebarde', 175, 'BF'),
    ('Lance de cavalerie', 100, 'BF+1'),
    ('Lance', 50, 'BF'),
    ('Main gauche', 15, 'BF-3'),
    ('Morgenstern', 60, 'BF'),
    ('Rapière', 40, 'BF-1'),
    ('Rondache', 10, 'BF-4'),
    ('Arbalète à répétition', 150, '2'),
    ('Arbalète de poing', 25, '2'),
    ('Arbalète', 120, '4'),
    ('Arc court', 75, '3'),
    ('Arc elfique', 75, '3'),
    ('Arc long', 90, '3'),
    ('Arc', 40, '3'),
    ('Arquebuse à répétition', 30, '4'),
    ('Arquebuse', 30, '4'),
    ('Bolas', 20, '1'),
    ('Dague/étoile de jet', 10, 'BF-3'),
    ('Filet', 60, 'Aucun'),
    ('Fouet', 40, 'BF-1'),
    ('Fronde', 10, '3'),
    ('Fustibale', 50, '4'),
    ('Hache/marteau de jet', 40, 'BF-2'),
    ('Javelot', 30, 'BF-1'),
    ('Lasso', 10, 'Aucun'),
    ('Long fusil d''Hochland', 70, '4'),
    ('Pistolet à répétition', 25, '4'),
    ('Pistolet', 25, '4'),
    ('Tromblon', 50, '3')
) AS base(name, encumbrance, damage_formula)
ON CONFLICT DO NOTHING;

-- Armures
INSERT INTO armors (name, encumbrance, armor_points, covered_locations)
SELECT base.name, base.encumbrance, base.armor_points, base.covered_locations
FROM (
  VALUES
    ('Calotte de cuir', 10, 1, ARRAY['tête']::TEXT[]),
    ('Gilet de cuir', 40, 1, ARRAY['corps']::TEXT[]),
    ('Jambières de cuir', 20, 1, ARRAY['jambes']::TEXT[]),
    ('Veste de cuir', 50, 1, ARRAY['corps', 'bras']::TEXT[]),
    ('Cagoule de mailles', 30, 2, ARRAY['tête']::TEXT[]),
    ('Chemise de mailles', 80, 2, ARRAY['corps', 'bras']::TEXT[]),
    ('Gilet de mailles', 60, 2, ARRAY['corps']::TEXT[]),
    ('Jambières de mailles', 40, 2, ARRAY['jambes']::TEXT[]),
    ('Manteau de mailles à manches', 100, 2, ARRAY['corps', 'bras', 'jambes']::TEXT[]),
    ('Manteau de mailles', 80, 2, ARRAY['corps', 'jambes']::TEXT[]),
    ('Brassards d''acier', 30, 2, ARRAY['bras']::TEXT[]),
    ('Casque', 40, 2, ARRAY['tête']::TEXT[]),
    ('Jambières d''acier', 40, 2, ARRAY['jambes']::TEXT[]),
    ('Plastron', 75, 2, ARRAY['corps']::TEXT[])
) AS base(name, encumbrance, armor_points, covered_locations)
ON CONFLICT DO NOTHING;



-- Ajout des triggers

-- Trigger pour ajouter un profile automatiquement à un utilisateur lors de sa création
-- Voir https://supabase.com/docs/guides/auth/managing-user-data#using-triggers pour plus de détails.
create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user_' || new.id::text),
    coalesce(new.email, 'user_' || new.id::text || '@example.invalid'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage!
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Trigger de suppression automatique d'une notification si :
-- 1. la notification a plus de 30 jours
-- 2. la notification est lue et a plus de 5 jours.
create function public.delete_old_notifications()
returns trigger
set search_path = ''
as $$
begin
  delete from public.notifications
  where (created_at < now() - interval '30 days')
  or (is_read = true and created_at < now() - interval '5 days');
  return new;
end;
$$ language plpgsql security definer;
create trigger delete_old_notifications_trigger
  after insert on public.notifications
  for each row execute procedure public.delete_old_notifications();

-- Droits PostGreSQL

GRANT ALL PRIVILEGES on schema public to authenticated;

-- Ajout des règles Supabase, les Row Level Security (RLS)
-- documentation : https://supabase.com/docs/guides/auth/row-level-security
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- RLS spécifique pour les utilisateur de leur propre profil.
create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Set up access controls for storage. Allows downloading object with public key
-- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload an avatar." on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

-- RLS pour les tables de règles.
-- Les tables : static_stats, careers, career_paths, skills, talents, weapon_attributes sont en lecture seules, sauf pour l'administrateur.
alter table static_stats
  enable row level security;
create policy "Admin can modify static_stats." on static_stats
  for all using (auth.role() = 'service_role');
create policy "Everyone can read static_stats." on static_stats
  for select using (true);

alter table careers
  enable row level security;
create policy "Admin can modify careers." on careers
  for all using (auth.role() = 'service_role');
create policy "Everyone can read careers." on careers
  for select using (true);

alter table career_paths
  enable row level security;
create policy "Admin can modify career_paths." on career_paths
  for all using (auth.role() = 'service_role');
create policy "Everyone can read career_paths." on career_paths
  for select using (true);

alter table skills
  enable row level security;
create policy "Admin can modify skills." on skills
  for all using (auth.role() = 'service_role');
create policy "Everyone can read skills." on skills
  for select using (true);

alter table talents
  enable row level security;
create policy "Admin can modify talents." on talents
  for all using (auth.role() = 'service_role');
create policy "Everyone can read talents." on talents
  for select using (true);

alter table weapon_attributes
  enable row level security;
create policy "Admin can modify weapon_attributes." on weapon_attributes
  for all using (auth.role() = 'service_role');
create policy "Everyone can read weapon_attributes." on weapon_attributes
  for select using (true);

alter table items
  enable row level security;
create policy "Users can create items." on items
  for insert
  to authenticated
  with check (auth.uid() is not null);
create policy "Admin can update items." on items
  for update
  using (auth.role() = 'service_role');
create policy "Admin can delete items." on items
  for delete
  using (auth.role() = 'service_role');
create policy "Users can read items." on items
  for select
  to authenticated
  using (auth.uid() is not null);

-- RLS pour les sessions :
-- N'importe quel utilisateur enregistré peut créer une session.
-- Le propriétaire d'une session peut la modifier ou l'archiver (c'est le fameux mj_id).
-- Les utilisateurs non propriétaire ne peuvent que visualiser les sessions dans lesquelles ils sont. C'est une contrainte complexe : un character a un propriétaire et une session liée.
-- Il faut donc vérifier que l'utilisateur est le propriétaire d'un character lié à la session.
alter table sessions
  enable row level security;
create policy "Users can create sessions." on sessions
  for insert to authenticated with check (auth.uid() = mj_id);
create policy "MJs can read own sessions." on sessions
  for select
  to authenticated
  using (auth.uid() = mj_id);
create policy "MJs can update own sessions." on sessions
  for update 
  to authenticated 
  using ( auth.uid() = mj_id);
create policy "Player can read own sessions." on sessions
  for select 
  to authenticated
  using ( exists (select 1 from characters where characters.session_id = sessions.id and characters.user_id = auth.uid()));

create policy "Users can read joined sessions via users_session." on sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from users_session
      where users_session.session_id = sessions.id
        and users_session.user_id = auth.uid()
        and users_session.active = true
    )
  );

-- RLS pour les characters :
-- N'importe quel utilisateur enregistré peut créer un character.
-- Le propriétaire d'un character peut le modifier ou l'archiver.
-- Les utilisateurs non propriétaire ne peuvent que visualiser les autres characters.
alter table characters
  enable row level security;

-- Required so RLS predicates referencing public.characters can be evaluated
-- by authenticated users (e.g. sessions visibility policies).
grant select, insert, update on public.characters to authenticated;

create policy "Users can create characters." on characters
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own characters." on characters
  for update 
  to authenticated using (auth.uid() = user_id);
create policy "Users can read own characters." on characters
  for select
  to authenticated
  using (auth.uid() = user_id);
create policy "Users can read other characters." on characters
  for select 
  to authenticated
  using (auth.uid() != user_id);

alter table character_stat_values
  enable row level security;

grant select, insert, update, delete on public.character_stat_values to authenticated;

create policy "Users can create character_stat_values." on character_stat_values
  for insert to authenticated with check (
    exists (
      select 1
      from characters
      where characters.id = character_stat_values.character_id
        and characters.user_id = auth.uid()
    )
  );
create policy "Users can update own character_stat_values." on character_stat_values
  for update to authenticated using (
    exists (
      select 1
      from characters
      where characters.id = character_stat_values.character_id
        and characters.user_id = auth.uid()
    )
  );
create policy "Users can delete own character_stat_values." on character_stat_values
  for delete to authenticated using (
    exists (
      select 1
      from characters
      where characters.id = character_stat_values.character_id
        and characters.user_id = auth.uid()
    )
  );
create policy "Users can read character_stat_values." on character_stat_values
  for select to authenticated using (true);

-- RLS pour les tables de liaison :
-- Il faut rendre cohérent les règles CRUD pour les tables de liaison.
-- Tables : character_skills, character_talents, character_weapons, character_armors, character_items
-- Règles : Sur ces tables, la création, l'update, la suppression sont pour le propriétaire du character lié à la table de liaison. Pour la lecture, toute personnes authentifié peut lire.

alter table character_skills
  enable row level security;
create policy "Users can create character_skills." on character_skills
  for insert to authenticated with check ( exists (select 1 from characters where characters.id = character_skills.character_id and characters.user_id = auth.uid()));
create policy "Users can update own character_skills." on character_skills
  for update
  to authenticated using ( exists (select 1 from characters where characters.id = character_skills.character_id and characters.user_id = auth.uid()));
create policy "Users can delete own character_skills." on character_skills
  for delete
  to authenticated using ( exists (select 1 from characters where characters.id = character_skills.character_id and characters.user_id = auth.uid()));
create policy "Users can read character_skills." on character_skills
  for select
  to authenticated
  using ( true );

alter table character_talents
  enable row level security;
create policy "Users can create character_talents." on character_talents
  for insert to authenticated with check ( exists (select 1 from characters where characters.id = character_talents.character_id and characters.user_id = auth.uid()));
create policy "Users can update own character_talents." on character_talents
  for update
  to authenticated using ( exists (select 1 from characters where characters.id = character_talents.character_id and characters.user_id = auth.uid()));
create policy "Users can delete own character_talents." on character_talents
  for delete
  to authenticated using ( exists (select 1 from characters where characters.id = character_talents.character_id and characters.user_id = auth.uid()));
create policy "Users can read character_talents." on character_talents
  for select
  to authenticated
  using ( true );

alter table character_weapons
  enable row level security;
create policy "Users can create character_weapons." on character_weapons
  for insert to authenticated with check ( exists (select 1 from characters where characters.id = character_weapons.character_id and characters.user_id = auth.uid()));
create policy "Users can update own character_weapons." on character_weapons
  for update
  to authenticated using ( exists (select 1 from characters where characters.id = character_weapons.character_id and characters.user_id = auth.uid()));
create policy "Users can delete own character_weapons." on character_weapons
  for delete
  to authenticated using ( exists (select 1 from characters where characters.id = character_weapons.character_id and characters.user_id = auth.uid()));
create policy "Users can read character_weapons." on character_weapons
  for select
  to authenticated
  using ( true );

alter table character_armors
  enable row level security;
create policy "Users can create character_armors." on character_armors
  for insert to authenticated with check ( exists (select 1 from characters where characters.id = character_armors.character_id and characters.user_id = auth.uid()));
create policy "Users can update own character_armors." on character_armors
  for update
  to authenticated using ( exists (select 1 from characters where characters.id = character_armors.character_id and characters.user_id = auth.uid()));
create policy "Users can delete own character_armors." on character_armors
  for delete
  to authenticated using ( exists (select 1 from characters where characters.id = character_armors.character_id and characters.user_id = auth.uid()));
create policy "Users can read character_armors." on character_armors
  for select
  to authenticated
  using ( true );

alter table character_items
  enable row level security;
create policy "Users can create character_items." on character_items
  for insert to authenticated with check ( exists (select 1 from characters where characters.id = character_items.character_id and characters.user_id = auth.uid()));
create policy "Users can update own character_items." on character_items
  for update
  to authenticated using ( exists (select 1 from characters where characters.id = character_items.character_id and characters.user_id = auth.uid()));
create policy "Admin can delete character_items." on character_items
  for delete
  to authenticated using (auth.role() = 'service_role');
create policy "Users can read character_items." on character_items
  for select
  to authenticated
  using ( true );



alter table notifications
  enable row level security;

-- Required so authenticated users can read notifications under RLS policies.
grant select on public.notifications to authenticated;
grant insert on public.notifications to authenticated;
grant update on public.notifications to authenticated;
grant delete on public.notifications to authenticated;

create or replace function public.get_session_owner_for_request(target_session_id uuid)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select s.mj_id
  from public.sessions s
  where s.id = target_session_id
    and s.is_archived = false
  limit 1;
$$;

revoke all on function public.get_session_owner_for_request(uuid) from public;
grant execute on function public.get_session_owner_for_request(uuid) to authenticated;

create policy "Users can create notifications." on notifications
  for insert to authenticated with check (auth.uid() = sender_user_id or sender_user_id is null);
create policy "Users can read own notifications." on notifications
  for select to authenticated using (auth.uid() = receiver_user_id);
create policy "Users can read sent notifications." on notifications
  for select to authenticated using (auth.uid() = sender_user_id);
create policy "Users can update own notifications." on notifications
  for update to authenticated using (auth.uid() = receiver_user_id);
create policy "Users can delete own notifications." on notifications
  for delete to authenticated using (auth.uid() = receiver_user_id);


-- Only MJ that own the session can create/update/delete a row in user session
-- User can delete or select their own row in user session
-- Other users that are in the session can select only 

alter table users_session
    enable row level security;

create or replace function public.is_session_mj(target_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sessions s
    where s.id = target_session_id
      and s.mj_id = auth.uid()
  );
$$;

revoke all on function public.is_session_mj(uuid) from public;
grant execute on function public.is_session_mj(uuid) to authenticated;

-- MJ policies :
create policy "MJ can create users_session." on users_session
    for insert to authenticated with check (exists (select 1 from sessions where sessions.id = users_session.session_id and sessions.mj_id = auth.uid()));
create policy "MJ can update users_session." on users_session
    for update to authenticated using (exists (select 1 from sessions where sessions.id = users_session.session_id and sessions.mj_id = auth.uid()));
create policy "MJ can delete users_session." on users_session
    for delete to authenticated using (exists (select 1 from sessions where sessions.id = users_session.session_id and sessions.mj_id = auth.uid()));
create policy "MJ can read users_session." on users_session
  for select to authenticated using (public.is_session_mj(users_session.session_id));
-- Owner user policies :
create policy "User can create users_session." on users_session
    for insert to authenticated with check (auth.uid() = users_session.user_id);
create policy "User can delete own users_session." on users_session
    for delete to authenticated using (auth.uid() = users_session.user_id);
create policy "User can read own users_session." on users_session
    for select to authenticated using (auth.uid() = users_session.user_id);
