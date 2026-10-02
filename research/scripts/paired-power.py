import sys
from math import comb

if len(sys.argv) != 3:
    sys.exit('usage: python3 paired-power.py <pairs> <baseline-win-rate>')
pairs, base = int(sys.argv[1]), float(sys.argv[2])


def smallest_passing(discordant: int) -> int:
    tail, k = 0, discordant + 1
    while k > 0 and (tail + comb(discordant, k - 1)) / 2 ** discordant < 0.025:
        k -= 1
        tail += comb(discordant, k)
    return k


# Exact power of the one-sided McNemar test at 0.025, with the two outcomes of a pair independent.
# A shared seed likely correlates them, which would leave fewer, more one-sided discordant pairs and more power.
print(f'{pairs} pairs, baseline win rate {base}')
for gain in (0.03, 0.05, 0.07, 0.10):
    up, down = (base + gain) * (1 - base), base * (1 - base - gain)
    split = up / (up + down)
    power = 0.0
    for discordant in range(pairs + 1):
        weight = comb(pairs, discordant) * (up + down) ** discordant * (1 - up - down) ** (pairs - discordant)
        k = smallest_passing(discordant)
        power += weight * sum(comb(discordant, i) * split ** i * (1 - split) ** (discordant - i) for i in range(k, discordant + 1))
    print(f'gain {gain:.2f}: power {power:.2f}', flush=True)
