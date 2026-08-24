@echo off
setlocal EnableDelayedExpansion
set "VALUE=before"
(
    set "VALUE=after"
    echo percent=%VALUE%
    echo delayed=!VALUE!
)
endlocal
