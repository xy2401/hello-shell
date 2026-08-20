# Demo 07: error handling - fish does not abort on failure; catch non-zero exits with if-not / or.
function run_fails
    return 3
end
set -l caught false
if not run_fails
    set caught true
end
echo "caughtError=$caught"

command ls /nonexistent-dir-hello-shell >/dev/null 2>&1
set -l fail_status $status
echo "afterFailure=continued"
echo "setEExitCode=$fail_status"
echo "scriptExitCode=0"
exit 0
