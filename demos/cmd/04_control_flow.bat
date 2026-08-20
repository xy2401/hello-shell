rem 04_control_flow: numeric for loop, CSV scan with for /f, file set counting
@echo off
setlocal EnableDelayedExpansion
set "FIXTURES=%HELLO_SHELL_FIXTURES%"
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem sum 1..3
set /a SUM=0
for /l %%i in (1,1,3) do set /a SUM+=%%i
echo sum123=!SUM!
rem scan orders.csv, skip the header, count rows whose 4th column is paid
set "PAID=0"
for /f "usebackq skip=1 tokens=4 delims=," %%s in ("%FIXTURES%\orders.csv") do (
    if "%%s"=="paid" set /a PAID+=1
)
echo paidCount=!PAID!
rem count files under fixtures\data with a file-set loop
set "FILES=0"
for %%f in ("%FIXTURES%\data\*") do set /a FILES+=1
echo loopFiles=!FILES!
exit /b 0
