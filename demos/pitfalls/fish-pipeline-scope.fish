#!/usr/bin/env fish
# A pipeline segment runs in a subshell, so its variable changes do not return.
set count 0
printf 'one\ntwo\n' | while read -l line
    set count (math $count + 1)
end
echo "afterPipeline=$count"

set count 0
for line in (printf 'one\ntwo\n')
    set count (math $count + 1)
end
echo "afterCapture=$count"
