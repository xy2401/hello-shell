#!/usr/bin/env bash
# Demo 06: pipes and files - glob listing, counts, and a cut | sort | uniq -c pipeline.
export LC_ALL=C  # deterministic sort order

joined=""
for f in /fixtures/data/*; do  # glob expands in sorted order
  base="${f##*/}"
  if [ -z "$joined" ]; then
    joined="$base"
  else
    joined="$joined,$base"
  fi
done
echo "globList=$joined"

logFiles=0
for f in /fixtures/data/*.log; do
  if [ -f "$f" ]; then
    logFiles=$((logFiles + 1))
  fi
done
echo "logFiles=$logFiles"

requestLines="$(grep -c request /fixtures/data/app.log)"
echo "requestLines=$requestLines"

statusCounts="$(tail -n +2 /fixtures/orders.csv | cut -d, -f4 | sort | uniq -c | awk '{ printf "%s%s:%s", sep, $2, $1; sep = "," }')"
echo "statusCounts=$statusCounts"
exit 0
