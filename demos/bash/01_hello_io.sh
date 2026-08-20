#!/usr/bin/env bash
# Demo 01: hello I/O - stdout vs stderr, and capturing a child's non-zero exit code via $?.
echo "stdout: hello from bash"
echo "stderr: this line goes to stderr" >&2
ls /nonexistent-dir-hello-shell >/dev/null 2>&1
childExitCode=$?
echo "childExitCode=$childExitCode"
echo "scriptExitCode=0"
exit 0
