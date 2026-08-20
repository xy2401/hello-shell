rem 01_hello_io: stdout vs stderr streams and capturing a failing command exit code
@echo off
setlocal EnableDelayedExpansion
set "FIXTURES=%HELLO_SHELL_FIXTURES%"
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
echo stdout: hello from cmd
echo stderr: this line goes to stderr 1>&2
rem dir on a missing path sets ERRORLEVEL=1, suppress all its output
dir /b "%FIXTURES%\no-such-dir" >nul 2>nul
set "CHILD_EXIT=!ERRORLEVEL!"
echo childExitCode=!CHILD_EXIT!
echo scriptExitCode=0
exit /b 0
