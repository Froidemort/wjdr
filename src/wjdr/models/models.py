"""Models for Warhammer JdR characters

This module defines the core data structures used to describe a character,
including attributes, skills, talents, careers, inventory, and money. The
models are implemented with Pydantic for validation and convenient defaults.
"""

from __future__ import annotations
import datetime
from typing import Literal, Optional, Self, get_args
from uuid import UUID, uuid4
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
    """Meta-information about a character sheet.

    Attributes
    ----------
    player_name : str | None
        Real name of the player.
    master_name : str | None
        Real name of the game master.
    campaign_name : str | None
        Campaign title.
    date_creation : datetime.date | None
        Creation date of the character.
    last_update : datetime.date | None
        Last update date of the character.
    """

    player_name: Optional[str] = Field(default=None, description="Nom réel du joueur", examples=["Jean", "Marie"])
    master_name: Optional[str] = Field(default=None, description="Nom réel du maitre du jeu", examples=["Jean", "Marie"])
    campaign_name: Optional[str] = Field(default=None, description="Nom de la campagne", examples=["Bienvenue à Altdorf", "Meurtre à Nuln"])
    date_creation: Optional[datetime.date] = Field(default_factory=datetime.date.today, description="Date de création du personnage")
    last_update: Optional[datetime.date] = Field(default_factory=datetime.datetime.now, description="Date de la dernière mise à jour du personnage")


class DetailedInformations(BaseModel):
    """Detailed biographical information.

    Attributes
    ----------
    age : int | None
        Age in years.
    eye_color : EyeColor | None
        Eye color.
    hair_color : HairColor | None
        Hair color.
    astral_sign : AstralSign | None
        Astral sign.
    birth_place : str | None
        Place of birth.
    height : float | None
        Height in centimeters.
    weight : float | None
        Weight in kilograms.
    sibling_number : int
        Number of siblings.
    distinctive_signs : list[str]
        Distinctive marks or traits.
    chaos_mutations : list[str]
        Chaos mutations, if any.
    """

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
    """A primary attribute with base and advanced parts.

    Attributes
    ----------
    base : int
        Base value determined at character creation.
    advanced : int
        Improvements purchased during progression (multiple of 5).

    Notes
    -----
    The effective attribute used in checks is ``base + advanced``.
    """

    base: int = Field(ge=0, default=0, le=100, description="Statistique de base du personnage entre 1 et 100", examples=[30, 40, 50])
    # TODO: maybe consider adding a "permanent" field to handle bonus from some talents
    # TODO: maybe consider adding a "from_object" field to handle bonus from some objects
    advanced: int = Field(ge=0, default=0, le=100, multiple_of=5, description="Statistique d'amélioration du personnage achetable avec l'expérience, entre 0 et 100, par pas de 5", examples=[0, 5, 10, 15, 20])

    @property
    def actual(self) -> int:
        """Return the effective value (base + advanced).

        Returns
        -------
        int
            Sum of ``base`` and ``advanced``.
        """
        return self.base + self.advanced


class PrimaryAttributes(BaseModel):
    """Container of all primary attributes.

    Attributes
    ----------
    fight_capacity : PrimaryAttribute
    shooting_capacity : PrimaryAttribute
    strength : PrimaryAttribute
    toughness : PrimaryAttribute
    agility : PrimaryAttribute
    intelligence : PrimaryAttribute
    mental_strength : PrimaryAttribute
    sociability : PrimaryAttribute
    """

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
        """Bonus of strength, useful for damage calculations.

        Returns
        -------
        int
            ``strength.actual // 10``.
        """
        return self.strength.actual // 10

    @property
    def toughness_bonus(self) -> int:
        """Bonus of toughness, useful for defense calculations.

        Returns
        -------
        int
            ``toughness.actual // 10``.
        """
        return self.toughness.actual // 10


class Talent(BaseModel, frozen=True):
    """A passive advantage that may grant bonuses or special rules.

    Attributes
    ----------
    name : str
        Talent name.
    description : str
        Description of the talent.
    permanent_bonus : tuple[PrimaryAttributeName, int] | None
        Optional permanent bonus applied to a primary attribute.
    """

    name: str
    description: str
    permanent_bonus: Optional[tuple[PrimaryAttributeName, int]] = Field(default=None, description="Permanent bonus to a primary attribute, in the form (attribute_name, bonus_amount)", examples=[("strength", 5), ("agility", 10)])


class SpecializedTalent(Talent, frozen=True):
    """A talent with a specialization string.
    The specialization is for example "Crafting (blacksmithing)"."""

    specialization: str


class Skill(BaseModel, frozen=True):
    """A skill tied to a primary attribute.
    A basic skill can be used untrained, but then the character suffers a attribute penalty of 50%.
    An advanced skill can only be used if the character has at least one level in it.

    Related talents can provide bonuses or special rules when using the skill.

    Attributes
    ----------
    name : str
        Skill name.
    basic : bool
        Whether the skill is basic (can be used untrained).
    description : str
        Short description of the skill.
    attribute : PrimaryAttributeName
        Governing attribute.
    talents : list[Talent]
        Related talents.
    """

    name: str
    basic: bool = True
    description: str
    attribute: PrimaryAttributeName

    talents: list[Talent] = Field(default=[], description="List of related talents")


class SpecializedSkill(Skill, frozen=True):
    """A skill with a specialization string (e.g. Craft (Bow))."""

    specialization: str


class CharacterSkill(BaseModel):
    """A skill owned by a character with an advancement bonus.

    Attributes
    ----------
    skill : Skill | SpecializedSkill
        The referenced skill.
    bonus : int
        Advancement bonus in steps of 10 (0, 10, 20).
    """

    skill: Skill | SpecializedSkill
    bonus: int = Field(ge=0, default=0, le=20, multiple_of=10, examples=[0, 10, 20])  # +0,+10,+20


class SecondaryAttribute(BaseModel):
    """A secondary attribute with base and advanced parts."""

    base: int = Field(ge=0, default=0)
    advanced: int = Field(ge=0, default=0)

    @property
    def actual(self) -> int:
        """Return the effective value (base + advanced)."""
        return self.base + self.advanced


class SecondaryAttributes(BaseModel):
    """Container of all secondary attributes."""

    attack: SecondaryAttribute = Field(default=SecondaryAttribute(base=1, advanced=0), serialization_alias="A", description="Number of attacks per round", examples=[1, 2, 3])
    wounds: SecondaryAttribute = Field(default=SecondaryAttribute(), serialization_alias="B", description="Point de blessures", examples=[8, 12, 18])
    movement: SecondaryAttribute = Field(default=SecondaryAttribute(), serialization_alias="M", description="Points de mouvement", examples=[3, 4, 5, 10])
    magic_point: SecondaryAttribute = Field(default=SecondaryAttribute(), serialization_alias="Mag", description="Points de magie", examples=[0, 1, 2, 3])


class Money(BaseModel, validate_assignment=True):
    """Money in Golden Crowns, Silver Pistols, and Copper Coins.

    Attributes
    ----------
    golden_crown : int
        Number of Golden Crowns (GC). 1 GC = 20 SP = 240 CC.
    silver_pistol : int
        Number of Silver Pistols (SP). 1 SP = 12 CC.
    copper_coins : int
        Number of Copper Coins (CC).
    """

    golden_crown: int = Field(ge=0, default=0)
    silver_pistol: int = Field(ge=0, default=0)
    copper_coins: int = Field(ge=0, default=0)

    @staticmethod
    def coerce_money(golden_crown: int, silver_pistol: int, copper_coins: int) -> tuple[int, int, int]:
        """Normalize money values by carrying over CC to SP and SP to GC.

        Parameters
        ----------
        golden_crown : int
            Golden Crowns.
        silver_pistol : int
            Silver Pistols.
        copper_coins : int
            Copper Coins.

        Returns
        -------
        tuple[int, int, int]
            Normalized ``(golden_crown, silver_pistol, copper_coins)``.
        """
        # Calculate the correct values without mutating self
        silver_pistol += copper_coins // 12
        copper_coins = copper_coins % 12
        golden_crown += silver_pistol // 20
        silver_pistol = silver_pistol % 20
        return golden_crown, silver_pistol, copper_coins

    @model_validator(mode="after")
    def validate_money(self) -> Self:
        """Pydantic validator to normalize internal money representation."""
        gc, sp, cc = self.coerce_money(self.golden_crown, self.silver_pistol, self.copper_coins)
        # Use object.__setattr__ to bypass pydantic validation on assignment (it prevents infinite loop)
        object.__setattr__(self, "golden_crown", gc)
        object.__setattr__(self, "silver_pistol", sp)
        object.__setattr__(self, "copper_coins", cc)
        return self

    def __add__(self, other: Money) -> Money:
        """Add two amounts of money and normalize the result.

        Parameters
        ----------
        other : Money
            The second operand.

        Returns
        -------
        Money
            New instance with the sum.
        """
        if not isinstance(other, Money):
            return NotImplemented  # pragma: no cover
        gc = self.golden_crown + other.golden_crown
        sp = self.silver_pistol + other.silver_pistol
        cc = self.copper_coins + other.copper_coins
        gc, sp, cc = self.coerce_money(gc, sp, cc)
        return Money(golden_crown=gc, silver_pistol=sp, copper_coins=cc)

    def to_copper_coins(self) -> int:
        """Convert the entire money amount to copper coins.

        Returns
        -------
        int
            Total amount in copper coins.
        """
        return self.golden_crown * 240 + self.silver_pistol * 12 + self.copper_coins

    def __sub__(self, other: Money) -> Money:
        """Subtract money, raising if the result would be negative.

        Parameters
        ----------
        other : Money
            The subtrahend.

        Returns
        -------
        Money
            New instance with the difference.

        Raises
        ------
        ValueError
            If subtraction would result in negative money.
        """
        if not isinstance(other, Money):
            return NotImplemented  # pragma: no cover
        # Convert everything to copper coins to handle subtraction
        total_cc_self = self.to_copper_coins()
        total_cc_other = other.to_copper_coins()
        if total_cc_self < total_cc_other:
            raise ValueError("Cannot have negative money")
        total_cc_result = total_cc_self - total_cc_other
        return Money(**dict(zip(("golden_crown", "silver_pistol", "copper_coins"), self.coerce_money(0, 0, total_cc_result))))


class EquipmentCategory(BaseModel):
    # TODO: maybe consider adding subcategories for "Divers"
    """Category and optional subcategory for an equipment item."""

    category: Literal["Armes", "Armures", "Munitions", "Divers"]
    subcategory: Optional[str] = None


class Equipment(BaseModel):
    """An equipment item with quantity and value.

    Attributes
    ----------
    name : str
        Item name.
    description : str | None
        Optional description.
    quality : {"Médiocre", "Moyenne", "Bonne", "Exceptionnelle"}
        Craft quality.
    category : EquipmentCategory
        Category metadata.
    clutter : int
        Encumbrance per unit.
    value : Money
        Unit price.
    quantity : int
        Owned quantity.
    """

    name: str
    description: Optional[str] = None
    quality: Literal["Médiocre", "Moyenne", "Bonne", "Exceptionnelle"] = "Moyenne"
    category: EquipmentCategory = Field(default=EquipmentCategory(category="Divers"))
    clutter: int = Field(ge=0, default=0)
    # Value in money, automatically coerced
    value: Optional[Money] = Field(default=None, description="Valeur unitaire de l'équipement")
    quantity: int = Field(ge=1, default=1)


class Inventory(BaseModel):
    """A character's inventory and money balance."""

    equipments: list[Equipment] = []
    money: Money = Field(default=Money(), description="Somme d'argent possédée par le personnage")

    @property
    def total_clutter(self) -> int:
        """Return the total encumbrance across all items (clutter × qty)."""
        return sum(e.clutter * e.quantity for e in self.equipments)


class Career(BaseModel):
    """A career definition used to constrain and price advancements.

    Attributes
    ----------
    name : str
        Career name.
    description : str | None
        Optional description.
    basic : bool
        Whether the career is basic.
    primary_attributes : dict[PrimaryAttributeName, int]
        Max ticks available for primary attributes (advanced part), in steps of 5.
    secondary_attributes : dict[SecondaryAttributeName, int]
        Max ticks available for secondary attributes.
    skills : tuple[str | tuple[str], ...]
        Career skills, possibly as alternatives using tuples.
    talents : tuple[str | tuple[str], ...]
        Career talents, possibly as alternatives using tuples.
    endowments : list[str]
        Starting gear or requirements.
    money : Money
        Starting money.
    accessible_careers : list[str]
        Careers accessible after this one.
    """

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

    endowments: list[str] = Field(default=[], description="Liste des dotations en début de carrière ou des objets à avoir pour accéder à cette carrière")
    money: Money = Field(default=Money(), description="Monnaie de départ lors de l'entrée dans cette carrière, ou argent à avoir pour accéder à cette carrière")

    accessible_careers: list[str] = Field(default=[], description="List of careers accessible after this one")

    @model_validator(mode="after")
    def validated_career_plan(self):
        """Ensure all expected attributes are present in the career plan.

        Raises
        ------
        ValueError
            If a primary or secondary attribute is missing.
        """
        for primary_attribute in get_args(PrimaryAttributeName):
            if primary_attribute not in self.primary_attributes:
                raise ValueError(f"{primary_attribute} must be in career plan")  # pragma: no cover
        for secondary_attribute in get_args(SecondaryAttributeName):
            if secondary_attribute not in self.secondary_attributes:
                raise ValueError(f"{secondary_attribute} must be in career plan")  # pragma: no cover
        return self

    @property
    def career_experience_amount(self) -> int:
        """Compute the total XP cost implied by this career plan.

        Returns
        -------
        int
            Total experience points needed.
        """
        # Every tick of primary attribute costs 100 experience
        experience = sum(value // 5 * 100 for value in self.primary_attributes.values())
        # Every tick of secondary attribute costs 100 experience
        experience += sum(value * 100 for value in self.secondary_attributes.values())
        if not self.basic:
            experience += len(self.skills) * 100
            experience += len(self.talents) * 100
        return experience


class Experience(BaseModel):
    """Track total and spent experience points (XP)."""

    total: int = Field(ge=0, default=0)
    spent: int = Field(ge=0, default=0, multiple_of=100)  # TODO: check id multiple of 100 is correct

    @property
    def available(self) -> int:
        """Return XP available to spend (``total - spent``)."""
        return self.total - self.spent

    @property
    def spendable_ticks(self) -> int:
        """Return the number of 100-XP steps available."""
        return self.available // 100


class Character(BaseModel, validate_assignment=True):
    """A playable character with attributes, skills, careers, and gear.

    Attributes
    ----------
    name : str
        Character name.
    gender : {"Masculin", "Feminin"}
        Character gender.
    race : {"Elfe", "Nain", "Humain", "Halfling"}
        Character race.
    detailed_informations : DetailedInformations
        Optional extended bio data.
    primary_attributes : PrimaryAttributes
        Primary stats.
    secondary_attributes : SecondaryAttributes
        Secondary stats.
    madness_points : int
        Current insanity/madness points.
    destiny_points : int
        Current destiny points.
    skills : set[CharacterSkill]
        Owned skills with bonuses.
    talents : set[Talent]
        Owned talents.
    careers : list[Career]
        Career history (last is current).
    inventory : Inventory
        Money and items.
    experience : Experience
        Experience ledger.
    meta_informations : MetaInformations
        Sheet meta-data.
    """

    # UUID to uniquifie characters, only useful in app
    id: UUID = Field(default_factory=uuid4)
    # Mandatory informations
    name: str = Field(description="Nom du personnage", examples=["Randuil", "Tharn", "Gruber"])
    gender: Literal["Masculin", "Feminin"]
    race: Literal["Elfe", "Nain", "Humain", "Halfling"]
    # Usefull but optional informations
    detailed_informations: DetailedInformations = Field(default=DetailedInformations())

    # Attributes
    primary_attributes: PrimaryAttributes = Field(default=PrimaryAttributes())
    secondary_attributes: SecondaryAttributes = Field(default=SecondaryAttributes())
    current_wounds: int = Field(default=0, ge=0, description="Current wounds of the character")
    # Special attributes
    madness_points: int = Field(ge=0, default=0)
    destiny_points: int = Field(ge=0, default=0)
    fortune_points: int = Field(ge=0, default=0)

    # Skills & Talents
    skills: set[CharacterSkill] = set()
    talents: set[Talent] = set()

    careers: list[Career] = []

    # Handle all the money and equipment
    inventory: Inventory = Field(default=Inventory())

    experience: Experience = Field(default=Experience())

    meta_informations: MetaInformations = Field(default=MetaInformations())

    @property
    def current_career(self):
        """Return the current career or ``None`` if none exists."""
        # In a normal case, a character has a career
        # The None case is when the character is created and has no career yet
        if self.careers:
            return self.careers[-1]
        else:
            return None

    @model_validator(mode="after")
    def validate_character(self):
        """Ensure attributes are consistent with career progression rules.

        Raises
        ------
        ValueError
            If advanced values exceed allowed maxima based on career(s).
        """
        # Ensure that attributes are coherent with careers
        # There is two cases :
        # - character has no career : all attributes must be 0 (only occurs when character is created)
        # - character has at least one career : this is the first career, the advanced attribute must be lower or equal to the career plan
        # - character has multiple careers : the advanced attribute can be higher thant the previous career plan, but must be lower or equal to the current career plan
        if not self.careers:
            for primary_attribute in get_args(PrimaryAttributeName):
                if getattr(self.primary_attributes, primary_attribute).advanced != 0:
                    raise ValueError(f"{primary_attribute} advanced must be 0 when character has no career")
            for secondary_attribute in get_args(SecondaryAttributeName):
                if getattr(self.secondary_attributes, secondary_attribute).advanced != 0:
                    raise ValueError(f"{secondary_attribute} advanced must be 0 when character has no career")
        if len(self.careers) >= 1:
            first_career = self.careers[0]
            for primary_attribute, max_value in first_career.primary_attributes.items():
                if getattr(self.primary_attributes, primary_attribute).advanced > max_value:
                    raise ValueError(f"{primary_attribute} advanced must be lower or equal to {max_value} from first career {first_career.name}")
            for secondary_attribute, max_value in first_career.secondary_attributes.items():
                if getattr(self.secondary_attributes, secondary_attribute).advanced > max_value:
                    raise ValueError(f"{secondary_attribute} advanced must be lower or equal to {max_value} from first career {first_career.name}")
        if len(self.careers) > 1:
            current_career = self.careers[-1]
            for primary_attribute, max_value in current_career.primary_attributes.items():
                if getattr(self.primary_attributes, primary_attribute).advanced > max_value:
                    raise ValueError(f"{primary_attribute} advanced must be lower or equal to {max_value} from current career {current_career.name}")
            for secondary_attribute, max_value in current_career.secondary_attributes.items():
                if getattr(self.secondary_attributes, secondary_attribute).advanced > max_value:
                    raise ValueError(f"{secondary_attribute} advanced must be lower or equal to {max_value} from current career {current_career.name}")
        # Check that spent experience is consistent with attributes and careers

        return self

    def add_skill(self, new_skill: CharacterSkill) -> None:
        """Add a skill or increase its bonus by +10 up to +20.

        Parameters
        ----------
        new_skill : CharacterSkill
            The skill to add or upgrade.
        """
        existing_skill = self._get_existing_skill(new_skill)

        if existing_skill:
            new_bonus = min(existing_skill.bonus + 10, 20)
            existing_skill.bonus = new_bonus
        else:
            self.skills.add(new_skill)

    def delete_skill(self, skill: CharacterSkill, all=False) -> None:
        """Remove or downgrade a skill.

        Parameters
        ----------
        skill : CharacterSkill
            Skill to remove/downgrade.
        all : bool, default=False
            If ``True``, remove entirely. Otherwise reduce bonus by 10
            (to a minimum of 0) and remove when it reaches 0.
        """
        # Note : This function is only usesulf when creating a new character and rolling for random skills
        existing_skill = self._get_existing_skill(skill)
        if existing_skill:
            if all or existing_skill.bonus == 0:
                self.skills.remove(existing_skill)
            else:
                existing_skill.bonus = max(existing_skill.bonus - 10, 0)

    def _get_existing_skill(self, character_skill: CharacterSkill) -> CharacterSkill | None:
        """Return a reference to an existing skill with the same base skill.

        Parameters
        ----------
        character_skill : CharacterSkill
            Skill to look up.

        Returns
        -------
        CharacterSkill | None
            The matching instance if found, else ``None``.
        """
        for s in self.skills:
            if s.skill == character_skill.skill:
                return s
        return None

    def add_talent(self, new_talent: Talent):
        """Add a talent to the character's set of talents."""
        self.talents.add(new_talent)

    def delete_talent(self, talent: Talent):
        """Remove a talent if present."""
        if talent in self.talents:
            self.talents.remove(talent)

    @property
    def max_clutter(self) -> int:
        """Maximum encumbrance tolerated before being cluttered.

        Returns
        -------
        int
            Strength actual value multiplied by a race-specific modifier.
        """
        race_modifier = {
            "Elfe": 10,
            "Nain": 20,
            "Humain": 10,
            "Halfling": 10,
        }
        return self.primary_attributes.strength.actual * race_modifier[self.race]

    @property
    def is_cluttered(self) -> bool:
        """Whether the inventory total clutter exceeds ``max_clutter``."""
        return self.inventory.total_clutter > self.max_clutter
