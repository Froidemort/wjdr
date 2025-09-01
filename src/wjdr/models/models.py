from collections import defaultdict
from typing import Iterable, Literal, Optional, Self, get_args
from pydantic import BaseModel, Field, model_validator

PrimaryAttributeName = Literal['fight_capacity', 'shooting_capacity', 'strength', 'toughness', 'agility', 'intelligence', 'mental_strength', 'sociability']
SecondaryAttributeName = Literal['attack', 'wounds', 'magic_point', 'movement']
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
    "Bleu foncé"
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
    "L'Étoile du Sorcier"
]
class DetailedInformations(BaseModel):
    age: Optional[int] = Field(gt=0, default=None, le=200)
    eye_color: Optional[EyeColor] = None
    hair_color: Optional[HairColor] = None
    astral_sign: Optional[AstralSign] = None
    birth_place: Optional[str] = None
    height: Optional[float] = Field(ge=100., le=200., default=None)
    weigth: Optional[float] = Field(ge=30., le=200., default=None)
    sibling_number: int = Field(ge=0, default=0)
    distinctive_signs: list[str] = []
    chaos_mutations: list[str] = []

class PrimaryAttribute(BaseModel, validate_assignment=True):
    base:int = Field(ge=0, default=0, le=100)
    advanced:int = Field(ge=0, default=0, le=100, multiple_of=5)
    actual:int = Field(ge=0, default=0, le=100)

    @model_validator(mode='after')
    def validate_actual(self) -> Self:
        if self.base + self.advanced > self.actual:
            raise ValueError(f"Actual {self.actual} must be lower than base {self.base} and advanced {self.advanced}")
        return self

class PrimaryAttributes(BaseModel):
    fight_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='CC')
    shooting_capacity: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='CT')
    strength: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='F')
    toughness: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='E')
    agility: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='Ag')
    intelligence: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='Int')
    mental_strength: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='FM')
    sociability: PrimaryAttribute = Field(default=PrimaryAttribute(), alias='Soc')

    @property
    def strength_bonus(self) -> int:
        return self.strength // 10

    @property
    def toughness_bonus(self) -> int:
        return self.toughness // 10

class Skill(BaseModel):
    name: str
    basic: bool = True
    description: str
    attribute: PrimaryAttributeName
    bonus: int = Field(ge=0, default=0, le=20, multiple_of=10) # +0,+10,+20

class SpecializedSkill(Skill):
    specialization: str

class Talent(BaseModel):
    name: str
    description: str
    skills: list[Skill] = Field(default=[], description="Liste des compétences liées au talent")

class SecondaryAttribute(BaseModel):
    base: int = Field(ge=0, default=0)
    advanced: int = Field(ge=0, default=0)
    actual: int = Field(ge=0, default=0)

    @model_validator(mode='after')
    def validate_actual(self) -> Self:
        if self.base + self.advanced > self.actual:
            raise ValueError(f"Actual {self.actual} must be lower than base {self.base} and advanced {self.advanced}")
        return self

class SecondaryAttributes(BaseModel):
    attack: SecondaryAttribute = Field(alias='A')
    wounds: SecondaryAttribute = Field(alias='B')
    movement: SecondaryAttribute = Field(alias='M')
    magic_point: SecondaryAttribute = Field(alias='Mag')

class Career(BaseModel):
    name: str = Field(description='Name of the career')
    basic: bool = True
    primary_attributes: dict[PrimaryAttributeName, int]
    secondary_attributes: dict[SecondaryAttributeName, int]

    skills = list[Skill]
    talents = list[Talent]

    @model_validator(mode='after')
    def validated_career_plan(self):
        for primary_attribute in get_args(PrimaryAttributeName):
            if primary_attribute not in self.primary_attributes:
                raise ValueError(f"{primary_attribute} must be in career plan")
        for secondary_attribute in get_args(PrimaryAttributeName):
                raise ValueError(f"{secondary_attribute} must be in career plan")
        return self

class SkillSet(set):
    def __init__(self, skills: Iterable[Skill]):
        skill_dict = defaultdict(int)
        for skill in skills:
            skill_dict[skill] += skill.bonus
            
        


class Character(BaseModel, validate_assignment=True):
    # Mandatory informations
    gender: Literal['Masculin', 'Feminin']
    race: Literal['Elfe', 'Nain', 'Humain', 'Halfling']
    # Usefull but optional informations
    detailed_informations: DetailedInformations

    # Attributes
    primary_attributes: PrimaryAttributes
    secondary_attributes: SecondaryAttributes
    # Special attributes
    madness_points: int = Field(ge=0, default=0)
    destiny_points: int = Field(ge=0, default=0)

    # Skills & Talents
    skills: set[Skill] = set()
    talents: set[Talent] = set()

    carrers: list[Career] = []
    
    @property
    def current_career(self):
        if self.carrers:
            return self.carrers[-1]
        else:
            return None
    
    def _coerce_attributes_career(self):
        if self.current_career:
            for primary_attribute, value in self.current_career.primary_attributes.items():
                value = max(value, getattr(self, primary_attribute))
                setattr(self, primary_attribute, value)
            for secondary_attribute, value in self.current_career.secondary_attributes.items():
                value = max(value, getattr(self, secondary_attribute))
                setattr(self, secondary_attribute, value)
            if self.current_career.basic:
                # Here we set starting skills and talents
                self.skills.union(set(self.current_career.skills))
                self.talents.union(set(self.current_career.talents))

    @model_validator(mode='after')
    def validate_character(self):
        self._coerce_attributes_career()
        return self
