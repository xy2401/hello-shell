# Demo 01: hello I/O - stdout vs stderr, and capturing a child's non-zero exit code via $status.
echo "stdout: hello from fish"
echo "stderr: this line goes to stderr" >&2
command ls /nonexistent-dir-hello-shell >/dev/null 2>&1
set -l child_status $status
echo "childExitCode=$child_status"
echo "scriptExitCode=0"
exit 0
