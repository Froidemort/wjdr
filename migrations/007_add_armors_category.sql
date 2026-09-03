--- Étape 1 : Ajout de la colonne 'category' en autorisant temporairement les NULL
alter table public.armors
add column category text;

--- Étape 2 : Mise à jour des valeurs existantes basées sur le nom (name)
-- On traite d'abord les cas les plus spécifiques ("cuir clouté" avant "cuir")
-- ATTENTION : il faut modifier cette partie si des armures "personnalisées" n'ont pas les mots clés ci dessous .
-- Dans ce cas, ajoutez au choix : une nouvelle category, ou un mot clé attaché à une catégorie existante.
update public.armors
set category = case
    when lower(name) like '%cuir clouté%' then 'cuir clouté'
    when lower(name) like '%cuir%' then 'cuir'
    when lower(name) like '%maille%' then 'maille'
    when lower(name) like '%écaille%' then 'écaille'
    when lower(name) like '%plaque%' then 'plaque'
    when lower(name) like '%acier%' then 'plaque'
    when lower(name) like '%ithilmar%' then 'ithilmar'
    when lower(name) like '%gromril%' then 'gromril'
    else category
end
where category is null;

--- Étape 3 (Sécurité) : Message explicite si une armure n'a pas de catégorie après la mise à jour

 do $$
 begin
   if exists (select 1 from public.armors where category is null) then
     raise exception 'Migration 007_add_armors_category: some armors are missing a category; add mappings or set a default before setting NOT NULL.';
   end if;
 end $$;


--- Étape 4 : Rendre la colonne non-nullable maintenant qu'elle est remplie
alter table public.armors
alter column category set not null;

--- Étape 5 : Ajout de la contrainte CHECK pour restreindre les valeurs valides
-- On commence par supprimer celle existante si elle existait déjà pour une obscure raison.
alter table public.armors
drop constraint if exists armors_category_check;

alter table public.armors
add constraint armors_category_check 
check (
    category = any (
        array[
            'cuir'::text,
            'cuir clouté'::text,
            'maille'::text,
            'écaille'::text,
            'plaque'::text,
            'ithilmar'::text,
            'gromril'::text
        ]
    )
);