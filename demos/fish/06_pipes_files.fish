# Demo 06: pipes and files - globs, pipelines (grep|wc), and text processing over fixtures.
# glob listing, sorted by fish
set -l names (for f in /fixtures/data/*; basename $f; end | sort)
echo "globList="(string join , $names)

# glob counting
echo "logFiles="(count /fixtures/data/*.log)

# pipeline: select lines, then count them
set -l requests (command grep request /fixtures/data/app.log | wc -l | string trim)
echo "requestLines=$requests"

# status tallies from the CSV's 4th column, first-seen order
set -l counts
while read -l line
    if test "$line" = "orderId,customer,amount,status"
        continue
    end
    set -l st (string split , $line)[4]
    set -l found false
    for j in (seq (count $counts))
        if test (string split : $counts[$j])[1] = $st
            set -l c (string split : $counts[$j])[2]
            set counts[$j] "$st:"(math $c + 1)
            set found true
            break
        end
    end
    if not $found
        set -a counts "$st:1"
    end
end < /fixtures/orders.csv
echo "statusCounts="(string join , $counts)
exit 0
