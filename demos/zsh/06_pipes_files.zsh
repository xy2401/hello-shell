#!/usr/bin/env zsh
# Demo 06: pipes and files - array glob listing, counts, and a cut | sort | uniq -c pipeline.
export LC_ALL=C  # deterministic sort order

# glob result goes straight into an array (sorted); :t maps to basenames, (j:,:) joins
files=( /fixtures/data/* )
basenames=( ${files:t} )
echo "globList=${(j:,:)basenames}"

logs=( /fixtures/data/*.log )
echo "logFiles=${#logs}"

requestLines="$(grep -c request /fixtures/data/app.log)"
echo "requestLines=$requestLines"

statusCounts="$(tail -n +2 /fixtures/orders.csv | cut -d, -f4 | sort | uniq -c | awk '{ printf "%s%s:%s", sep, $2, $1; sep = "," }')"
echo "statusCounts=$statusCounts"
exit 0
