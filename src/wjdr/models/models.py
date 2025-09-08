import datetime
from functools import partial
from typing import Literal, Optional, Self, get_args
from pydantic import BaseModel, Field, model_validator

from .random import DicePool

PrimaryAttributeName = Literal[
    "fight_capacity",
    "shooting_capacity",
    "strength",
    "toughness",
    "agility",
    "intelligence",
    "mental_strength",
    "sociability",
]
SecondaryAttributeName = Literal["attack", "wounds", "magic_point", "movement"]
EyeColor = Literal[
    "Gris-bleu",
    "Bleu",
    "Vert",
    "Cuivre",
    "Marron clair",
    "Marron",
    "Marron foncé",
    "Argent",
    "Mauve",
    "Noir",
    "Noisette",
]
HairColor = Literal[
    "Argenté",
    "Blond cendré",
    "Paille",
    "Blond",
    "Auburn",
    "Châtain clair",
    "Châtain",
    "Brun",
    "Noir",
    "Roux",
    "Bleu foncé",
]
AstralSign = Literal[
    "Wymund l'Anachorète",
    "La Grande Croix",
    "Le Trait du Peintre",
    "Gnutus le Buffle",
    "Dragomas le Dragon",
    "Le Crépuscule",
    "Le Fourreau de Grungni",
    "Mammit le Sage",
    "Mummit le Fou",
    "Les Deux Boeufs",
    "Le Danseur",
    "Le Tambour",
    "Le Flûtiste",
    "Vobist le Pâle",
    "La Charrette Brisée",
    "La Chèvre Sauvage",
    "Le Chaudron de Rhya",
    "Cackelfax le Coq",
    "Le Grimoire",
    "L'Étoile du Sorcier",
]


class MetaInformations(BaseModel):
    player_name: Optional[str] = Field(default=None, description="Nom réel du joueur", examples=["Jean", "Marie"])
    master_name: Optional[str] = Field(default=None, description="Nom réel du maitre du jeu", examples=["Jean", "Marie"])
    campaign_name: Optional[str] = Field(default=None, description="Nom de la campagne", examples=["Bienvenue à Altdorf", "Meurtre à Nuln"])
    date_creation: Optional[datetime.date] = Field(default_factory=datetime.date.today, description="Date de création du personnage")
    last_update: Optional[datetime.date] = Field(default_factory=datetime.datetime.now, description="Date de la dernière mise à jour du personnage")


class DetailedInformations(BaseModel):
    age: Optional[int] = Field(gt=0, default=None, le=200, examples=[25, 30, 45], description="Âge du personnage en années")
    eye_color: Optional[EyeColor] = Field(default=None, description="Couleur des yeux du personnage", examples=["Bleu", "Marron", "Noir"])
    hair_color: Optional[HairColor] = Field(default=None, description="Couleur des cheveux du personnage", examples=["Blond", "Brun", "Roux"])
    astral_sign: Optional[AstralSign] = Field(default=None, description="Signe astral du personnage", examples=["Le Danseur", "Le Grimoire", "La Chèvre Sauvage"])
    birth_place: Optional[str] = Field(default=None, description="Lieu de naissance du personnage", examples=["Altdorf", "Nuln", "Middenheim"])
    height: Optional[float] = Field(ge=100.0, le=200.0, default=None, description="Taille du personnage en cm", examples=[160.0, 175.5, 180.2])
    weight: Optional[float] = Field(ge=30.0, le=200.0, default=None)
    sibling_number: int = Field(ge=0, default=0, description="Nombre de frères et sœurs du personnage", examples=[0, 1, 2, 3])
    distinctive_signs: list[str] = Field(default=[], description="Liste des signes distinctifs du personnage", examples=[["Cicatrice sur le visage", "Tatouage en forme de dragon"]])
    chaos_mutations: list[str] = Field(default=[], description="Liste des mutations du Chaos du personnage", examples=[["Peau écailleuse", "Yeux rouges"]])


class PrimaryAttribute(BaseModel, validate_assignment=True):
    base: int = Field(ge=0, default=0, le=100, description="Statistique de base du personnage entre 1 et 100", examples=[30, 40, 50])
    # TODO: maybe consider adding a "permanent" field to handle bonus from some talents
    # TODO: maybe consider adding a "from_object" field to handle bonus from some objects
    advanced: int = Field(ge=0, default=0, le=100, multiple_of=5, description="Statistique d'amélioration du personnage achetable avec l'expérience, entre 0 et 100, par pas de 5", examples=[0, 5, 10, 15, 20])

    @property
    def actual(self) -> int:
        return self.base + self.advanced


class PrimaryAttributes(BaseModel):
    fight_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="CC")
    shooting_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="CT")
    strength: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="F")
    toughness: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="E")
    agility: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="Ag")
    intelligence: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="Int")
    mental_strength: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="FM")
    sociability: PrimaryAttribute = Field(default=PrimaryAttribute(), serialization_alias="Soc")

    @property
    def strength_bonus(self) -> int:
        return self.strength.actual // 10

    @property
    def toughness_bonus(self) -> int:
        return self.toughness.actual // 10


class Talent(BaseModel):
    name: str
    description: str
    permanent_bonus: Optional[tuple[PrimaryAttributeName, int]] = Field(default=None, description="Permanent bonus to a primary attribute, in the form (attribute_name, bonus_amount)", examples=[("strength", 5), ("agility", 10)])

    def __eq__(self, other_talent: object) -> bool:
        return self.name == getattr(other_talent, "name", None) and self.description == getattr(other_talent, "description", None) and self.permanent_bonus == getattr(other_talent, "permanent_bonus", None)


class SpecializedTalent(Talent):
    specialization: str

    def __eq__(self, other_talent: object) -> bool:
        return self.specialization == getattr(other_talent, "specialization", None) and super().__eq__(other_talent)

    def __hash__(self) -> int:
        return hash(self.specialization) ^ super().__hash__()


class Skill(BaseModel):
    name: str
    basic: bool = True
    description: str
    attribute: PrimaryAttributeName

    talents: list[Talent] = Field(default=[], description="List of related talents")

    def __eq__(self, other_skill: object) -> bool:
        return self.name == getattr(other_skill, "name", None) and self.basic == getattr(other_skill, "basic", None) and self.attribute == getattr(other_skill, "attribute", None) and self.talents == getattr(other_skill, "talents", None)

    def __hash__(self) -> int:
        return hash((self.name, self.basic, self.attribute, tuple(self.talents)))


class SpecializedSkill(Skill):
    specialization: str

    def __eq__(self, other_skill: object):
        return self.specialization == getattr(other_skill, "specialization", None) and super().__eq__(other_skill)

    def __hash__(self) -> int:
        return hash(self.specialization) ^ super().__hash__()


class CharacterSkill(BaseModel):
    skill: Skill | SpecializedSkill
    bonus: int = Field(ge=0, default=0, le=20, multiple_of=10, examples=[0, 10, 20])  # +0,+10,+20


class SecondaryAttribute(BaseModel):
    base: int = Field(ge=0, default=0)
    advanced: int = Field(ge=0, default=0)

    @property
    def actual(self) -> int:
        return self.base + self.advanced


class SecondaryAttributes(BaseModel):
    attack: SecondaryAttribute = Field(serialization_alias="A", description="Number of attacks per round", examples=[1, 2, 3])
    wounds: SecondaryAttribute = Field(serialization_alias="B", description="Point de blessures", examples=[8, 12, 18])
    movement: SecondaryAttribute = Field(serialization_alias="M", description="Points de mouvement", examples=[3, 4, 5, 10])
    magic_point: SecondaryAttribute = Field(serialization_alias="Mag", description="Points de magie", examples=[0, 1, 2, 3])


class Money(BaseModel, validate_assignment=True):
    golden_crown: int = Field(ge=0, default=0)
    silver_pistol: int = Field(ge=0, default=0)
    copper_coins: int = Field(ge=0, default=0)

    @staticmethod
    def coerce_money(golden_crown: int, silver_pistol: int, copper_coins: int) -> tuple[int, int, int]:
        # Calculate the correct values without mutating self
        silver_pistol += copper_coins // 12
        copper_coins = copper_coins % 12
        golden_crown += silver_pistol // 20
        silver_pistol = silver_pistol % 20
        return golden_crown, silver_pistol, copper_coins

    @model_validator(mode="after")
    def validate_money(self) -> Self:
        gc, sp, cc = self.coerce_money(self.golden_crown, self.silver_pistol, self.copper_coins)
        # Use object.__setattr__ to bypass pydantic validation on assignment (it prevents infinite loop)
        object.__setattr__(self, "golden_crown", gc)
        object.__setattr__(self, "silver_pistol", sp)
        object.__setattr__(self, "copper_coins", cc)
        return self

    def __add__(self, other: "Money") -> "Money":
        if not isinstance(other, Money):
            return NotImplemented
        gc = self.golden_crown + other.golden_crown
        sp = self.silver_pistol + other.silver_pistol
        cc = self.copper_coins + other.copper_coins
        gc, sp, cc = self.coerce_money(gc, sp, cc)
        return Money(golden_crown=gc, silver_pistol=sp, copper_coins=cc)

    def __sub__(self, other: "Money") -> "Money":
        if not isinstance(other, Money):
            return NotImplemented
        # Convert everything to copper coins to handle subtraction
        total_cc_self = self.golden_crown * 240 + self.silver_pistol * 12 + self.copper_coins
        total_cc_other = other.golden_crown * 240 + other.silver_pistol * 12 + other.copper_coins
        if total_cc_self < total_cc_other:
            raise ValueError("Cannot have negative money")
        total_cc_result = total_cc_self - total_cc_other
        gc = total_cc_result // 240
        sp = (total_cc_result % 240) // 12
        cc = total_cc_result % 12
        return Money(golden_crown=gc, silver_pistol=sp, copper_coins=cc)


class EquipmentCategory(BaseModel):
    # TODO: maybe consider adding subcategories for "Divers"
    category: Literal["Armes", "Armures", "Munitions", "Divers"]
    subcategory: Optional[str] = None


class Equipment(BaseModel):
    name: str
    description: Optional[str] = None
    quality: Literal["Médiocre", "Moyenne", "Bonne", "Exceptionnelle"] = "Moyenne"
    category: EquipmentCategory = Field(default=EquipmentCategory(category="Divers"))
    clutter: int = Field(ge=0, default=0)
    # Value in money, automatically coerced
    value: Money = Field(default=Money(), description="Valeur unitaire de l'équipement")
    quantity: int = Field(ge=1, default=1)


class Inventory(BaseModel):
    equipments: list[Equipment] = []
    money: Money = Field(default=Money(), description="Somme d'argent possédée par le personnage")

    @property
    def total_clutter(self) -> int:
        return sum(e.clutter * e.quantity for e in self.equipments)


class Career(BaseModel):
    name: str = Field(description="Nom de la carrière", examples=["Guerrier", "Prêtre", "Voleur"])
    description: Optional[str] = Field(default=None, description="Description de la carrière")
    basic: bool = True
    # Primary and secondary attributes that will be set to the character
    primary_attributes: dict[PrimaryAttributeName, int]
    secondary_attributes: dict[SecondaryAttributeName, int]

    # Here we can have a list of skills, or a tuple.
    # The tuple is a modeling trick to say "one of these skills",
    # also it keeps order when we map it after a GUI choice.
    # A sequence of skills where each item can be a skill string or a tuple of alternatives
    skills: tuple[str | tuple[str], ...]
    # A sequence of talents where each item can be a talent string or a tuple of alternatives
    talents: tuple[str | tuple[str], ...]

    endowments: list[str] = Field(default=[], description="Liste des dotations en début de carrière ou des objets à avoir pour acccéder à cette carrière")
    money: Money = Field(default=Money(), description="Monnaie de départ lors de l'entrée dans cette carrière, ou argent à avoir pour accéder à cette carrière")


    accessible_careers: list[str] = Field(default=[], description="List of careers accessible after this one")

    @model_validator(mode="after")
    def validated_career_plan(self):
        for primary_attribute in get_args(PrimaryAttributeName):
            if primary_attribute not in self.primary_attributes:
                raise ValueError(f"{primary_attribute} must be in career plan")
        for secondary_attribute in get_args(SecondaryAttributeName):
            if secondary_attribute not in self.secondary_attributes:
                raise ValueError(f"{secondary_attribute} must be in career plan")
        return self

    @property
    def career_experience_amount(self) -> int:
        # Every tick of primary attribute costs 100 experience
        experience = sum(value // 5 * 100 for value in self.primary_attributes.values())
        # Every tick of secondary attribute costs 100 experience
        experience += sum(value * 100 for value in self.secondary_attributes.values())
        if not self.basic:
            experience += len(self.skills) * 100
            experience += len(self.talents) * 100
        return experience


class Experience(BaseModel):
    total: int = Field(ge=0, default=0)
    spent: int = Field(ge=0, default=0, multiple_of=100)  # TODO: check id multiple of 100 is correct

    @property
    def available(self) -> int:
        return self.total - self.spent

    @property
    def spendable_ticks(self) -> int:
        return self.available % 100


# TODO: primary attribute factory must depends on a race
def primary_attribute_random_factory() -> PrimaryAttributes:
    attrs = {}
    for attr in get_args(PrimaryAttributeName):
        base_value = DicePool({10: 2}, 20).roll()  # 2d10+20
        attrs[attr] = PrimaryAttribute(base=base_value, advanced=0)
    return PrimaryAttributes(**attrs)


# TODO: secondary attribute factory must depends on a race
def secondary_attribute_random_factory() -> SecondaryAttributes:
    attr = {}
    attr["attack"] = SecondaryAttribute(base=1, advanced=0)  # Always 1 attack at start
    attr["wounds"] = SecondaryAttribute(base=12, advanced=0)  # 2d10+20
    attr["movement"] = SecondaryAttribute(base=4, advanced=0)  # 4 for now
    attr["magic_point"] = SecondaryAttribute(base=0, advanced=0)  # Always 0 at start
    return SecondaryAttributes(**attr)


def race_skill_factory(race: Literal["Elfe", "Nain", "Humain", "Halfling"]) -> set[CharacterSkill]:
    return set()


class Character(BaseModel, validate_assignment=True):
    # Mandatory informations
    name: str = Field(description="Nom du personnage", examples=["Randuil", "Tharn", "Gruber"])
    gender: Literal["Masculin", "Feminin"]
    race: Literal["Elfe", "Nain", "Humain", "Halfling"]
    # Usefull but optional informations
    detailed_informations: DetailedInformations = Field(default=DetailedInformations())

    # Attributes
    primary_attributes: PrimaryAttributes = Field(default_factory=primary_attribute_random_factory)
    secondary_attributes: SecondaryAttributes = Field(default_factory=secondary_attribute_random_factory)
    # Special attributes
    madness_points: int = Field(ge=0, default=0)
    destiny_points: int = Field(ge=0, default=0)

    # Skills & Talents
    skills: set[CharacterSkill] = set()
    talents: set[Talent] = set()

    carrers: list[Career] = []

    # Handle all the money and equipment
    inventory: Inventory = Field(default=Inventory())

    experience: Experience = Field(default=Experience())

    meta_informations: MetaInformations = Field(default=MetaInformations())

    @property
    def current_career(self):
        # In a normal case, a character has a career
        # The None case is when the character is created and has no career yet
        if self.carrers:
            return self.carrers[-1]
        else:
            return None

    @model_validator(mode="after")
    def validate_character(self):
        # Ensure that attributes are coherent with careers
        # There is two cases :
        # - character has no career : all attributes must be 0 (only occurs when character is created)
        # - character has at least one career : this is the first career, the advanced attribute must be lower or equal to the career plan
        # - character has multiple careers : the advanced attribute can be higher thant the previous career plan, but must be lower or equal to the current career plan
        if not self.carrers:
            for primary_attribute in get_args(PrimaryAttributeName):
                if getattr(self.primary_attributes, primary_attribute).advanced != 0:
                    raise ValueError(f"{primary_attribute} advanced must be 0 when character has no career")
            for secondary_attribute in get_args(SecondaryAttributeName):
                if getattr(self.secondary_attributes, secondary_attribute).advanced != 0:
                    raise ValueError(f"{secondary_attribute} advanced must be 0 when character has no career")
        if len(self.carrers) >= 1:
            first_career = self.carrers[0]
            for primary_attribute, max_value in first_career.primary_attributes.items():
                if getattr(self.primary_attributes, primary_attribute).advanced > max_value:
                    raise ValueError(f"{primary_attribute} advanced must be lower or equal to {max_value} from first career {first_career.name}")
            for secondary_attribute, max_value in first_career.secondary_attributes.items():
                if getattr(self.secondary_attributes, secondary_attribute).advanced > max_value:
                    raise ValueError(f"{secondary_attribute} advanced must be lower or equal to {max_value} from first career {first_career.name}")
        if len(self.carrers) > 1:
            current_career = self.carrers[-1]
            for primary_attribute, max_value in current_career.primary_attributes.items():
                if getattr(self.primary_attributes, primary_attribute).advanced > max_value:
                    raise ValueError(f"{primary_attribute} advanced must be lower or equal to {max_value} from current career {current_career.name}")
            for secondary_attribute, max_value in current_career.secondary_attributes.items():
                if getattr(self.secondary_attributes, secondary_attribute).advanced > max_value:
                    raise ValueError(f"{secondary_attribute} advanced must be lower or equal to {max_value} from current career {current_career.name}")
        # Check that spent experience is consistent with attributes and careers

        return self

    def add_skill(self, new_skill: CharacterSkill) -> None:
        existing_skill = self._get_existing_skill(new_skill)

        if existing_skill:
            new_bonus = min(existing_skill.bonus + 10, 20)
            existing_skill.bonus = new_bonus
        else:
            self.skills.add(new_skill)

    def delete_skill(self, skill: CharacterSkill) -> None:
        # Note : This function is only usesulf when creating a new character and rolling for random skills
        existing_skill = self._get_existing_skill(skill)
        if existing_skill:
            if existing_skill.bonus == 0:
                self.skills.remove(existing_skill)
            else:
                existing_skill.bonus = max(existing_skill.bonus - 10, 0)

    def _get_existing_skill(self, character_skill: CharacterSkill) -> CharacterSkill | None:
        for s in self.skills:
            if s.skill == character_skill.skill:
                return s
        return None

    def add_talent(self, new_talent: Talent):
        self.talents.add(new_talent)

    @property
    def max_clutter(self) -> int:
        race_modifier = {
            "Elfe": 10,
            "Nain": 20,
            "Humain": 10,
            "Halfling": 10,
        }
        return self.primary_attributes.strength.actual * race_modifier[self.race]

    def is_cluttered(self) -> bool:
        return self.inventory.total_clutter > self.max_clutter


if __name__ == "__main__":
    s = Skill(name="Esquive", basic=False, description="Permet d'esquiver au lieu de parer les attaques", attribute="agility", talents=[])
    cs = CharacterSkill(skill=s, bonus=0)
