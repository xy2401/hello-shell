rem 02_variables_quoting: set "var=value" quoting, for tokenizing, interpolation, glob literals
@echo off
setlocal EnableDelayedExpansion
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem quoted assignment keeps the space inside the value
set "VALUE=hello world"
echo value=!VALUE!
rem count tokens of "hello world cmd" with the for tokenizer
set "WORDS=%VALUE% cmd"
set "COUNT=0"
for %%w in (!WORDS!) do set /a COUNT+=1
echo wordCount=!COUNT!
set "NUM=42"
echo interpolated=value-is-!NUM!
rem star stays literal in cmd, no glob expansion happens
set "STAR=a*b*c"
echo starLiteral=!STAR!
exit /b 0
