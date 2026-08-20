# Demo 04: control flow - for/while loops, if/else, and built-in string filtering over fixtures.
set -l total 0
for i in 1 2 3
    set total (math $total + $i)
end
echo "sum123=$total"

# count paid orders: fish filters lines with a built-in, no grep subprocess needed
set -l paid 0
while read -l line
    if string match -q -- '*,paid' $line
        set paid (math $paid + 1)
    end
end < /fixtures/orders.csv
echo "paidCount=$paid"

# loop over a glob (files only, no dirs under /fixtures/data)
set -l n 0
for f in /fixtures/data/*
    set n (math $n + 1)
end
echo "loopFiles=$n"
exit 0
