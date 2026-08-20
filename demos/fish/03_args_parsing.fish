# Demo 03: hand-rolled argument parsing - re-exec self with fixed args when run bare, then loop over $argv.
if test (count $argv) -eq 0
    # no args: re-exec self with a fixed argument list (quoted arg, flags, option with value)
    exec fish (status filename) alice "bob smith" --verbose -n 3
end

set -l script_name (string replace -r '.*/' '' (status filename))
set -l verbose false
set -l n_value ""
set -l positional
set -l i 1
while test $i -le (count $argv)
    set -l arg $argv[$i]
    if test "$arg" = "--verbose"
        set verbose true
    else if test "$arg" = "-n"
        set i (math $i + 1)
        set n_value $argv[$i]
    else
        set -a positional $arg
    end
    set i (math $i + 1)
end

echo "invocation=$script_name"
echo "argCount="(count $argv)
echo "firstArg=$positional[1]"
echo "secondArg=$positional[2]"
echo "verboseFlag=$verbose"
echo "nValue=$n_value"
exit 0
