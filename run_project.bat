@echo off
REM ==========================================================================
REM  R Practical - run the whole project with one command (Windows)
REM
REM    run_project.bat          analysis + report + dashboard production build
REM    run_project.bat dev      same, then start the dashboard at localhost:3000
REM
REM  Step 1 (R) is the exam submission; steps 2-3 (dashboard) are optional and
REM  are skipped with a message if Node.js/npm is not installed.
REM ==========================================================================
setlocal
cd /d "%~dp0"

REM ---- Locate Rscript: PATH first, then the newest standard install ----
set "RSCRIPT="
for /f "delims=" %%R in ('where Rscript 2^>nul') do if not defined RSCRIPT set "RSCRIPT=%%R"
if not defined RSCRIPT (
  for /f "delims=" %%D in ('dir /b /ad /o-n "%ProgramFiles%\R\R-*" 2^>nul') do (
    if not defined RSCRIPT if exist "%ProgramFiles%\R\%%D\bin\Rscript.exe" set "RSCRIPT=%ProgramFiles%\R\%%D\bin\Rscript.exe"
  )
)
if not defined RSCRIPT (
  echo [ERROR] Rscript was not found. Install R from https://cran.r-project.org or add its bin folder to PATH.
  exit /b 1
)
echo Using R: %RSCRIPT%

echo.
echo === [1/3] R analysis, report, QA and dashboard data (build_report.R) ===
"%RSCRIPT%" build_report.R
if errorlevel 1 (
  echo [ERROR] The R pipeline failed - read the message above. Common causes: no internet
  echo         connection to api.worldbank.org, or Microsoft Edge/Chrome missing for the PDF step.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo [SKIPPED] npm not found - the R outputs are complete. Install Node.js 20+ to build the dashboard.
  exit /b 0
)

echo.
echo === [2/3] Dashboard dependencies ===
pushd frontend
if not exist node_modules (
  call npm install
  if errorlevel 1 ( echo [ERROR] npm install failed. & popd & exit /b 1 )
) else (
  echo node_modules present - skipping npm install
)

echo.
echo === [3/3] Dashboard production build ===
call npm run build
if errorlevel 1 ( echo [ERROR] Dashboard build failed. & popd & exit /b 1 )

if /i "%~1"=="dev" (
  echo.
  echo Starting the dashboard at http://localhost:3000  ^(Ctrl+C to stop^)
  call npm run dev
) else (
  echo.
  echo Done. Start the dashboard with:  cd frontend ^&^& npm run start   ^(http://localhost:3000^)
)
popd
endlocal
