"""Dice utilities for Warhammer JdR.

This module provides helpers to represent and roll pools of dice. It favors a
compact string representation (e.g. "2d10+3") that can be parsed into a
structured object, and a simple API to produce a random integer result.

Notes
-----
- The current implementation uses ``random.sample`` to draw pips from the
  ``[1, n_face]`` range without replacement. This means the sum of multiple
  dice of the same face value cannot contain duplicate pips within a single
  die type. This differs from standard dice rolls (with replacement). This
  behavior is intentional to preserve existing semantics and tests.
"""

from random import sample
from typing import Self, Any
from dataclasses import dataclass
import re
@dataclass(frozen=True)
class DicePool:
    """Represent and roll a pool of dice with an optional modifier.

    Parameters
    ----------
    dices : dict[int, int]
        Mapping where each key is the number of faces of a die (e.g. 6, 10)
        and each value is the count of such dice to roll.
    modifier : int, optional
        A constant value added to the roll result, by default ``0``.

    Attributes
    ----------
    dices : dict[int, int]
        Internal mapping of faces to counts used for rolls.
    modifier : int
        Value added to the final result.
    """
    dices: dict[int, int]
    modifier: int


    def roll(self) -> int:
        """Roll the pool and return the resulting sum.

        Returns
        -------
        int
            The sum of the pips drawn for each die in the pool plus
            ``modifier``.

        Notes
        -----
        For each die type ``n_face`` with ``n_dice`` count, values are drawn
        using ``random.sample(range(1, n_face+1), n_dice)``. See module
        notes for the implications of sampling without replacement.
        """
        return sum((sum(sample(range(1,n_face+1), n_dice)) for n_face, n_dice in self.dices.items())) + self.modifier
    
    @classmethod
    def from_string(cls, pool_str: str) -> Self:
        """Parse a dice pool from a compact string representation.

        Supported forms include expressions like ``"2d10"``, ``"3d6+2"``,
        and combinations thereof (e.g., ``"2d10+1d6-3"``). Multiple dice with
        the same number of faces are aggregated.

        Parameters
        ----------
        pool_str : str
            The dice pool string to parse.

        Returns
        -------
        DicePool
            An instance representing the parsed pool and modifier.

        Raises
        ------
        ValueError
            If no valid ``NdF`` pattern is found in ``pool_str``.

        Examples
        --------
        >>> DicePool.from_string("2d10+3")
        DicePool(dices={10: 2}, modifier=3)  # doctest: +ELLIPSIS

        >>> DicePool.from_string("1d6+1d6-2").dices
        {6: 2}
        """
        pattern = r'(\d+)d(\d+)'
        dices: dict[int, int] = {}
        modifier = 0

        # Find all dice expressions
        for dice_match in re.finditer(pattern, pool_str):
            n_dice = int(dice_match.group(1))
            n_face = int(dice_match.group(2))
            dices[n_face] = dices.get(n_face, 0) + n_dice
        if not dices:
            raise ValueError(f"Invalid dice pool string: {pool_str}")
        # Remove dice expressions to isolate modifier
        rest = re.sub(pattern, '', pool_str)
        rest = rest.replace('++', '+').replace('--', '+').replace('+-', '-').replace('-+', '-')
        rest = rest.replace(' ', '')

        if rest:
            # Find all modifiers (+/- numbers)
            mod_matches = re.findall(r'([+-]\d+)', rest)
            modifier = sum(int(m) for m in mod_matches) if mod_matches else 0

        return cls(dices, modifier)

def dice_roll_map(dice_face: int, pool_map: dict[tuple[int, int], Any]) -> Any:
    """Roll a dice, map to the pool map in order to return the corresponding value.
    Parameters
    ----------
    dice_face : int
        The number of faces of the dice to roll.
    pool_map : dict[tuple[int], Any]
        A mapping from dice roll result to the desired output value.
        The tuple keys represent possible roll ranges.
    Returns
    -------
    Any
        The mapped value from the pool map based on the rolled result.
    Raises
    ------
    ValueError
        If the rolled result is not found in the pool map.
    Examples
    --------
    >>> pool_map = {(1, 1): 10, (2, 2): 20, (3, 3): 30, (4, 4): 40, (5, 5): 50, (6, 6): 60}
    >>> dice_roll_map(6, pool_map)  # Possible outputs: 10, 20, 30, 40, 50, or 60
    40  # doctest: +ELLIPSIS
    >>> pool_map = {(1, 3): "Low", (4, 6): "High"}
    >>> dice_roll_map(6, pool_map)  # Possible outputs: "Low" or "High"
    'High'  # doctest: +ELLIPSIS
    """
    # Flatten pool_map range keys (e.g., (1, 3): value) into single-face keys.
    flat_map: dict[int, Any] = {}
    for key, value in pool_map.items():
        if not isinstance(key, tuple) or len(key) != 2:
            raise ValueError(f"Invalid pool_map key {key!r}, expected a (start, end) tuple.")
        start, end = key
        if start > end:
            raise ValueError(f"Invalid range {key!r}: start greater than end.")
        for face in range(start, end + 1):
            if face in flat_map and flat_map[face] != value:
                raise ValueError(f"Overlapping ranges for face {face}.")
            flat_map[face] = value
    # Ensure coverage for the dice faces to avoid KeyError later.
    missing = [i for i in range(1, dice_face + 1) if i not in flat_map]
    if missing:
        raise ValueError(f"Pool map does not cover faces: {missing}")
    dice = DicePool(dices={dice_face: 1}, modifier=0)
    roll_result = dice.roll()
    for face, mapped_value in flat_map.items():
        if roll_result == face:
            return mapped_value
    raise ValueError(f"Roll result {roll_result} not found in pool map.")