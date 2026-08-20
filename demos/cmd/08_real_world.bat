rem 08_real_world: copy fixture data to scratch, rename *.log to *.log.bak, count and verify
@echo off
setlocal EnableDelayedExpansion
set "SRC=%HELLO_SHELL_FIXTURES%\data"
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
set "DST=%WORK%\data"
mkdir "%DST%"
copy /y "%SRC%\*" "%DST%" >nul
rem prepared = files copied into the scratch dir
set "PREP=0"
for %%f in ("%DST%\*") do set /a PREP+=1
rem rename every *.log to *.log.bak and count the results
ren "%DST%\*.log" *.log.bak >nul
set "RENAMED=0"
for %%f in ("%DST%\*.log.bak") do set /a RENAMED+=1
set /a UNCH=PREP-RENAMED
rem verify: the .bak file exists and the original .log is gone
set "VERIFY=fail"
if exist "%DST%\app.log.bak" if not exist "%DST%\app.log" set "VERIFY=ok"
echo prepared=!PREP!
echo renamed=!RENAMED!
echo unchanged=!UNCH!
echo verify=!VERIFY!
echo report=prepared=!PREP!,renamed=!RENAMED!,unchanged=!UNCH!
exit /b 0
