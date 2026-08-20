rem 00_env: shell identity - version line, shell name, platform
@echo off
setlocal EnableDelayedExpansion
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem capture the single line printed by the ver builtin
set "VERSION_LINE="
for /f "delims=" %%v in ('ver') do set "VERSION_LINE=%%v"
echo version=!VERSION_LINE!
echo shell=cmd
echo platform=windows
exit /b 0
