from random import sample
from typing import Self

class DicePool:
    def __init__(self, dices: dict[int, int], modifier: int = 0):
        self.dices = dices
        self.modifier = modifier

    def roll(self) -> int:
        return sum((sum(sample(range(1,n_face+1), n_dice)) for n_dice, n_face in self.dices.items())) + self.modifier
    
    @classmethod
    def from_string(cls, pool_str: str) -> Self:
        # Example of pool_str: "2d6+3", "d8-1", "3d10"
        parts = pool_str.split('d')
        num_dices = int(parts[0]) if parts[0] else 1
        if '+' in parts[1]:
            sides_str, mod_str = parts[1].split('+')
            modifier = int(mod_str)
        elif '-' in parts[1]:
            sides_str, mod_str = parts[1].split('-')
            modifier = -int(mod_str)
        else:
            sides_str = parts[1]
            modifier = 0
        sides = int(sides_str)
        dices = {sides: num_dices}
        return cls(dices, modifier)