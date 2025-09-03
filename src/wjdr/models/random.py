from random import sample
from typing import Self
import re

class DicePool:
    def __init__(self, dices: dict[int, int], modifier: int = 0):
        self.dices = dices
        self.modifier = modifier

    def roll(self) -> int:
        return sum((sum(sample(range(1,n_face+1), n_dice)) for n_face, n_dice in self.dices.items())) + self.modifier
    
    @classmethod
    def from_string(cls, pool_str: str) -> Self:
        pattern = r'(\d+)d(\d+)'
        dices = {}
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