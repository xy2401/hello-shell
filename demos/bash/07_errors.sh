#!/usr/bin/env bash
# Demo 07: error handling - recover from a failing command (|| ; a trap ERR would also work).
caughtError=false
false || caughtError=true  # failure is caught; the script keeps running
echo "caughtError=$caughtError"
echo "afterFailure=continued"

( set -e; false )  # set -e makes the subshell stop at the first failure
setEExitCode=$?
echo "setEExitCode=$setEExitCode"
echo "scriptExitCode=0"
exit 0
