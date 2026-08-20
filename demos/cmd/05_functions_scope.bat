rem 05_functions_scope: call :label subroutines, exit /b return codes, setlocal scope
@echo off
setlocal EnableDelayedExpansion
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem subroutines return values via environment variables
call :get_answer
echo functionResult=!RESULT!
rem exit /b N sets ERRORLEVEL seen by the caller
call :fail_routine
echo exitCodeReturn=!ERRORLEVEL!
rem setlocal/endlocal inside the subroutine keeps its change local
set "SCOPE=outer"
call :set_scope
echo afterCall=!SCOPE!
exit /b 0

:get_answer
set "RESULT=42"
exit /b 0

:fail_routine
exit /b 7

:set_scope
setlocal
set "SCOPE=inner"
endlocal
exit /b 0
