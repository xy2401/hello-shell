# Demo 08: real-world task - stage fixtures into /tmp/work, rename *.log to *.log.bak, then verify and report.
rm -rf /tmp/work
mkdir -p /tmp/work
cp -r /fixtures/data /tmp/work/data

set -l prepared 0
set -l renamed 0
set -l unchanged 0
for f in /tmp/work/data/*
    test -f $f; or continue
    set prepared (math $prepared + 1)
    if string match -q -- '*.log' $f
        mv $f $f.bak
        set renamed (math $renamed + 1)
    else
        set unchanged (math $unchanged + 1)
    end
end

# verify: the renamed file exists, the old name is gone, and the file set matches the expectation
set -l verify ok
test -f /tmp/work/data/app.log.bak; or set verify fail
test -e /tmp/work/data/app.log; and set verify fail
set -l final_names (for f in /tmp/work/data/*; basename $f; end | sort)
if test (string join , $final_names) != "app.log.bak,config.csv,readme.txt"
    set verify fail
end

echo "prepared=$prepared"
echo "renamed=$renamed"
echo "unchanged=$unchanged"
echo "verify=$verify"
echo "report=prepared=$prepared,renamed=$renamed,unchanged=$unchanged"
exit 0
