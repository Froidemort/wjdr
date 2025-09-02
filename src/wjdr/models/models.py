import datetime
from typing import Literal, Optional, Self, get_args
from pydantic import BaseModel, Field, model_validator

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
    player_name: Optional[str] = None
    master_name: Optional[str] = None
    campaign_name: Optional[str] = None
    date_creation: Optional[datetime.date] = Field(default_factory=datetime.date.today)
    last_update: Optional[datetime.date] = Field(default_factory=datetime.datetime.now)

class DetailedInformations(BaseModel):
    age: Optional[int] = Field(gt=0, default=None, le=200)
    eye_color: Optional[EyeColor] = None
    hair_color: Optional[HairColor] = None
    astral_sign: Optional[AstralSign] = None
    birth_place: Optional[str] = None
    height: Optional[float] = Field(ge=100.0, le=200.0, default=None)
    weigth: Optional[float] = Field(ge=30.0, le=200.0, default=None)
    sibling_number: int = Field(ge=0, default=0)
    distinctive_signs: list[str] = []
    chaos_mutations: list[str] = []


class PrimaryAttribute(BaseModel, validate_assignment=True):
    base: int = Field(ge=0, default=0, le=100)
    # TODO: maybe consider adding a "permanent" field to handle bonus from some talents
    # TODO: maybe consider adding a "from_object" field to handle bonus from some objects
    advanced: int = Field(ge=0, default=0, le=100, multiple_of=5)
    actual: int = Field(ge=0, default=0, le=100)

    @model_validator(mode="after")
    def validate_actual(self) -> Self:
        if self.base + self.advanced > self.actual:
            raise ValueError(f"Actual {self.actual} must be lower than base {self.base} and advanced {self.advanced}")
        return self


class PrimaryAttributes(BaseModel):
    fight_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="CC")
    shooting_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="CT")
    strength: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="F")
    toughness: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="E")
    agility: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="Ag")
    intelligence: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="Int")
    mental_strength: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="FM")
    sociability: PrimaryAttribute = Field(default=PrimaryAttribute(), alias="Soc")

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
    actual: int = Field(ge=0, default=0)

    @model_validator(mode="after")
    def validate_actual(self) -> Self:
        if self.base + self.advanced > self.actual:
            raise ValueError(f"Actual {self.actual} must be lower than base {self.base} and advanced {self.advanced}")
        return self


class SecondaryAttributes(BaseModel):
    attack: SecondaryAttribute = Field(alias="A")
    wounds: SecondaryAttribute = Field(alias="B")
    movement: SecondaryAttribute = Field(alias="M")
    magic_point: SecondaryAttribute = Field(alias="Mag")


class Career(BaseModel):
    name: str = Field(description="Name of the career")
    basic: bool = True
    # Primary and secondary attributes that will be set to the character
    primary_attributes: dict[PrimaryAttributeName, int]
    secondary_attributes: dict[SecondaryAttributeName, int]

    # Here we can have a list of skills, or a tuple.
    # The tuple is a modeling trick to say "one of these skills"
    skills: tuple[Skill | tuple[Skill]]
    talents: tuple[Talent | tuple[Talent]]

    @model_validator(mode="after")
    def validated_career_plan(self):
        for primary_attribute in get_args(PrimaryAttributeName):
            if primary_attribute not in self.primary_attributes:
                raise ValueError(f"{primary_attribute} must be in career plan")
        for secondary_attribute in get_args(PrimaryAttributeName):
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
    value: Money = Field(default=Money(), description="Unitary value of the equipment")
    quantity: int = Field(ge=1, default=1)


class Inventory(BaseModel):
    equipments: list[Equipment] = []
    money: Money = Field(default=Money(), description="Total money owned by the character")

    @property
    def total_clutter(self) -> int:
        return sum(e.clutter * e.quantity for e in self.equipments)


class Experience(BaseModel):
    total: int = Field(ge=0, default=0)
    spent: int = Field(ge=0, default=0, multiple_of=100) # TODO: check id multiple of 100 is correct

    @property
    def available(self) -> int:
        return self.total - self.spent
    
    @property
    def spendable_ticks(self) -> int:
        return self.available % 100

class Character(BaseModel, validate_assignment=True):
    # Mandatory informations
    gender: Literal["Masculin", "Feminin"]
    race: Literal["Elfe", "Nain", "Humain", "Halfling"]
    # Usefull but optional informations
    detailed_informations: DetailedInformations

    # Attributes
    primary_attributes: PrimaryAttributes
    secondary_attributes: SecondaryAttributes
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

    def _coerce_career_attributes(self):
        if self.current_career:
            for (
                primary_attribute,
                value,
            ) in self.current_career.primary_attributes.items():
                value = max(value, getattr(self, primary_attribute))
                object.__setattr__(self, primary_attribute, value)
            for (
                secondary_attribute,
                value,
            ) in self.current_career.secondary_attributes.items():
                value = max(value, getattr(self, secondary_attribute))
                object.__setattr__(self, secondary_attribute, value)
            if self.current_career.basic:
                for skill in self.current_career.skills:
                    if isinstance(skill, tuple):
                        skill = skill[0] # Take the first skill in the tuple
                    character_skill = CharacterSkill(skill=skill, bonus=0)
                    self.add_skill(character_skill)
                for talent in self.current_career.talents:
                    if isinstance(talent, tuple):
                        talent = talent[0] # Take the first talent in the tuple
                    self.add_talent(talent)

    @model_validator(mode="after")
    def validate_character(self):
        self._coerce_career_attributes()
        return self

    def add_skill(self, new_skill: CharacterSkill):
        existing_skill = self._get_existing_skill(new_skill)

        if existing_skill:
            new_bonus = min(existing_skill.bonus + 10, 20)
            existing_skill.bonus = new_bonus
        else:
            self.skills.add(new_skill)

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
