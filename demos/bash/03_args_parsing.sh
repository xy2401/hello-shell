#!/usr/bin/env bash
# Demo 03: argument parsing - self re-exec with sample args, then a while/case/shift loop.
if [ "$#" -eq 0 ]; then
  exec bash "$0" alice "bob smith" --verbose -n 3
fi

argCount=$#
verboseFlag=false
nValue=""
positional=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --verbose)
      verboseFlag=true
      shift
      ;;
    -n)
      nValue="$2"
      shift 2
      ;;
    *)
      positional+=("$1")
      shift
      ;;
  esac
done

echo "invocation=${0##*/}"
echo "argCount=$argCount"
echo "firstArg=${positional[0]}"
echo "secondArg=${positional[1]}"
echo "verboseFlag=$verboseFlag"
echo "nValue=$nValue"
exit 0
