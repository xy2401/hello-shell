#!/usr/bin/env bash
# Demo 05: functions and scope - echo result, $? exit-code return, and local-only mutation.
globalVar="outer"

compute() {
  local total=$((40 + 2))
  echo "$total"  # caller captures stdout via $(...)
}

fail_with_seven() {
  return 7  # exit-code channel, not text
}

shadow_global() {
  local globalVar="inner"  # shadows the global only inside this function
}

functionResult="$(compute)"
echo "functionResult=$functionResult"

fail_with_seven
echo "exitCodeReturn=$?"

shadow_global
echo "afterCall=$globalVar"
exit 0
