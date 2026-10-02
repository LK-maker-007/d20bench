#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "usage: [OPPONENTS=\"<agent> ...\"] [CHUNK=<seeds per job>] research/scripts/evaluate.sh <agent> <first-seed> <seeds-per-side> <out.jsonl> [scenario-id ...]" >&2
  exit 2
fi

agent="$1"
first_seed="$2"
seeds="$3"
out="$4"
shift 4
scenarios=("$@")
if [ "${#scenarios[@]}" -eq 0 ]; then
  scenarios=(
    public.goblin-duel.v1
    public.goblin-warband-6v6.v1
    public.hero-mirror-balanced-l5.v1
    public.hero-mirror-chokepoint-l5.v1
    public.hero-mirror-status-l5.v1
  )
fi
read -r -a opponents <<< "${OPPONENTS:-battlecast.smart battlecast.aggressive battlecast.kiting battlecast.defensive}"
chunk="${CHUNK:-25}"

# The same seeds are played from both sides, split into chunks so slow maps spread across cores.
jobs=()
for scenario in "${scenarios[@]}"; do
  for opponent in "${opponents[@]}"; do
    for ((start = first_seed; start < first_seed + seeds; start += chunk)); do
      size=$(( first_seed + seeds - start < chunk ? first_seed + seeds - start : chunk ))
      jobs+=("$agent $opponent $scenario $start $size")
      jobs+=("$opponent $agent $scenario $start $size")
    done
  done
done

: > "$out"
printf '%s\n' "${jobs[@]}" | xargs -P "$(nproc)" -L 1 node research/scripts/run-matches.mjs | tee -a "$out"
echo "wrote $(wc -l < "$out") matches to $out"
