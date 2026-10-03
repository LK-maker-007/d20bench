import json
import sys

if len(sys.argv) < 7:
    sys.exit('usage: python3 missing-games.py <played.jsonl> <agent> <first-seed> <seeds-per-side> <scenario-id> <opponent> [opponent ...]')

played_path, agent, first_arg, seeds_arg, scenario = sys.argv[1:6]
opponents = sys.argv[6:]
first, seeds = int(first_arg), int(seeds_arg)
chunk = 5

played = set()
for line in open(played_path):
    row = json.loads(line)
    played.add((row['red'], row['blue'], row['scenario'], row['seed']))

# One run-matches.mjs job per run of consecutive unplayed seeds, at most `chunk` seeds long, for each side.
for opponent in opponents:
    for red, blue in ((agent, opponent), (opponent, agent)):
        start = None
        for seed in range(first, first + seeds + 1):
            missing = seed < first + seeds and (red, blue, scenario, seed) not in played
            if missing and start is None:
                start = seed
            if start is not None and (not missing or seed - start == chunk):
                print(red, blue, scenario, start, seed - start)
                start = seed if missing else None
