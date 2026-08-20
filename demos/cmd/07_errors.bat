rem 07_errors: ERRORLEVEL checks, continuing after failure, child process exit code (cmd has no set -e)
@echo off
setlocal EnableDelayedExpansion
set "FIXTURES=%HELLO_SHELL_FIXTURES%"
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem run a failing command, then branch on ERRORLEVEL instead of aborting
set "CAUGHT=false"
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if !ERRORLEVEL! neq 0 set "CAUGHT=true"
echo caughtError=!CAUGHT!
echo afterFailure=continued
rem no set -e in cmd, so run the failing command in a child cmd and read its exit code
cmd /c "dir C:\nonexistent-hello-shell >nul 2>nul"
echo setEExitCode=!ERRORLEVEL!
echo scriptExitCode=0
exit /b 0
