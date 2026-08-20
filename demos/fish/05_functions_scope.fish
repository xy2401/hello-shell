# Demo 05: functions and scope - fish functions return exit codes (captured via $status); vars are scoped per function.
function make_answer
    return 42  # a fish function "returns" an exit code, not a value
end
make_answer
set -l result $status
echo "functionResult=$result"

function fail_seven
    return 7
end
fail_seven
set -l rc $status
echo "exitCodeReturn=$rc"

function set_scope_demo
    set -l afterCall inner  # -l stays inside the function; the outer value is untouched
end
set -l afterCall outer
set_scope_demo
echo "afterCall=$afterCall"
exit 0
