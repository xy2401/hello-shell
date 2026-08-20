rem 06_pipes_files: dir /b listing, find counting through pipes, fixed-order status histogram
@echo off
setlocal EnableDelayedExpansion
set "FIXTURES=%HELLO_SHELL_FIXTURES%"
set "ORDERS=%FIXTURES%\orders.csv"
set "DATA=%FIXTURES%\data"
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
rem dir /b lists bare names sorted, join them with commas
set "LIST="
for /f "delims=" %%f in ('dir /b "%DATA%"') do (
    if defined LIST ( set "LIST=!LIST!,%%f" ) else ( set "LIST=%%f" )
)
echo globList=!LIST!
rem count *.log files with a file-set loop (robust when nothing matches)
set "LOGC=0"
for %%f in ("%DATA%\*.log") do set /a LOGC+=1
echo logFiles=!LOGC!
rem count lines matching request in app.log
set "REQC=0"
for /f %%c in ('find "request" "%DATA%\app.log" ^| find /c /v ""') do set "REQC=%%c"
echo requestLines=!REQC!
rem filter paid rows into the scratch dir, then count each status via type + find /c
find "paid" "%ORDERS%" > "%WORK%\paid-orders.csv"
set "PAID=0"
set "PEND=0"
set "REF=0"
for /f %%c in ('type "%ORDERS%" ^| find /c "paid"') do set "PAID=%%c"
for /f %%c in ('type "%ORDERS%" ^| find /c "pending"') do set "PEND=%%c"
for /f %%c in ('type "%ORDERS%" ^| find /c "refunded"') do set "REF=%%c"
echo statusCounts=paid:!PAID!,pending:!PEND!,refunded:!REF!
exit /b 0
