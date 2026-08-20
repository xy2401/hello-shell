#!/usr/bin/env zsh
# Demo 08: real-world batch - copy fixtures to a staging dir, rename *.log, verify, report.
rm -rf /tmp/work
mkdir -p /tmp/work
cp -r /fixtures/data /tmp/work/data

files=( /tmp/work/data/*(N.) )  # (N)=nullglob, (.)=regular files
prepared=${#files}

renamed=0
for f in /tmp/work/data/*.log(N); do
  mv "$f" "$f.bak"
  renamed=$((renamed + 1))
done
unchanged=$((prepared - renamed))

# after the rename no *.log may remain (N) keeps an empty match from being an error in zsh
leftovers=( /tmp/work/data/*.log(N) )
baks=( /tmp/work/data/*.log.bak(N) )
verify=ok
if [ "${#leftovers}" -ne 0 ] || [ "${#baks}" -eq 0 ]; then
  verify=fail
fi

echo "prepared=$prepared"
echo "renamed=$renamed"
echo "unchanged=$unchanged"
echo "verify=$verify"
echo "report=prepared=$prepared,renamed=$renamed,unchanged=$unchanged"
exit 0
