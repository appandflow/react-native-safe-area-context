@echo off
setlocal
rem subst the example app to a short drive to avoid Windows MAX_PATH in
rem CMake-generated object file names from autolinked codegen.
subst W: "%GITHUB_WORKSPACE%\example" || exit /b 1
robocopy W:\node_modules\react-native-test-app W:\r /MIR /NFL /NDL /NJH /NJS /NP
if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%
cd /D W:\android || exit /b 1
call gradlew.bat assembleDebug
