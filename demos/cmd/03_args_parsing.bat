rem 03_args_parsing: re-exec self with sample args, then parse with a shift loop
@echo off
setlocal EnableDelayedExpansion
if "%~1"=="" (
    call "%~f0" alice "bob smith" --verbose -n 3
    exit /b !ERRORLEVEL!
)
set "WORK=%TEMP%\hello-shell-work"
if exist "%WORK%" rd /s /q "%WORK%"
mkdir "%WORK%"
set "FIRST=%~1"
set "SECOND=%~2"
set "ARGC=0"
set "VERBOSE=false"
set "NVAL="
:loop
if "%~1"=="" goto done
if "%~1"=="--verbose" set "VERBOSE=true"
if "%~1"=="-n" goto getn
set /a ARGC+=1
shift
goto loop
:getn
set /a ARGC+=1
shift
set "NVAL=%~1"
set /a ARGC+=1
shift
goto loop
:done
echo invocation=%~nx0
echo argCount=!ARGC!
echo firstArg=!FIRST!
echo secondArg=!SECOND!
echo verboseFlag=!VERBOSE!
echo nValue=!NVAL!
exit /b 0
