#!/usr/bin/env bash
# Demo 08: real-world batch - copy fixtures to a staging dir, rename *.log, verify, report.
rm -rf /tmp/work
mkdir -p /tmp/work
cp -r /fixtures/data /tmp/work/data

prepared=0
for f in /tmp/work/data/*; do
  if [ -f "$f" ]; then
    prepared=$((prepared + 1))
  fi
done

renamed=0
for f in /tmp/work/data/*.log; do
  if [ -f "$f" ]; then
    mv "$f" "$f.bak"
    renamed=$((renamed + 1))
  fi
done
unchanged=$((prepared - renamed))

verify=ok
for f in /tmp/work/data/*.log; do
  if [ -e "$f" ]; then
    verify=fail  # an original .log is left behind
  fi
done
for f in /tmp/work/data/*.log.bak; do
  if [ ! -f "$f" ]; then
    verify=fail  # an expected .log.bak is missing
  fi
done

echo "prepared=$prepared"
echo "renamed=$renamed"
echo "unchanged=$unchanged"
echo "verify=$verify"
echo "report=prepared=$prepared,renamed=$renamed,unchanged=$unchanged"
exit 0
