#!/usr/bin/env zsh
# Demo 04: control flow - for loop sum, while-read over a CSV, and a glob loop over files.
sum123=0
for i in {1..3}; do
  sum123=$((sum123 + i))
done
echo "sum123=$sum123"

paidCount=0
# skip the header with tail; in zsh the pipeline's last segment runs in the
# current shell, so paidCount survives. Note: the field is NOT named "status"
# here - in zsh `status` is a reserved read-only name (alias of $?).
tail -n +2 /fixtures/orders.csv | while IFS=, read -r orderId customer amount orderStatus; do
  if [ "$orderStatus" = "paid" ]; then
    paidCount=$((paidCount + 1))
  fi
done
echo "paidCount=$paidCount"

loopFiles=0
for f in /fixtures/data/*; do
  if [ -f "$f" ]; then
    loopFiles=$((loopFiles + 1))
  fi
done
echo "loopFiles=$loopFiles"
exit 0
