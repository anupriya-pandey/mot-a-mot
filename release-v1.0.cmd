@echo off
REM Mot-à-Mot V1.0 — initialize git repo and create v1.0.0 tag
REM Run from project root after Git is installed

cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Download from https://git-scm.com/download/win
  exit /b 1
)

if exist .env (
  echo WARNING: .env exists - it will NOT be committed ^(.gitignore^)
)

git init
git add -A
echo.
echo Staged files ^(verify .env is NOT listed^):
git status --short
echo.
set /p CONFIRM="Continue with V1.0 commit? (Y/N): "
if /i not "%CONFIRM%"=="Y" exit /b 0

git commit -m "Release Mot-à-Mot V1.0 — first public iteration"
git tag -a v1.0.0 -m "Mot-à-Mot V1.0"
git branch -M main

echo.
echo Done! V1.0 committed and tagged.
echo Next: create a public repo on GitHub, then run:
echo   git remote add origin https://github.com/YOUR_USERNAME/mot-a-mot.git
echo   git push -u origin main
echo   git push origin v1.0.0
echo.
echo Full guide: docs\GITHUB-PUBLISH.md
