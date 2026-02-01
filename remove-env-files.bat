@echo off
echo ========================================
echo Removing Environment Files from Git
echo ========================================
echo.

echo Checking current status...
git status

echo.
echo Removing .env.production.template from Git...
git rm --cached .env.production.template

echo.
echo Removing .env.example if it has secrets...
git rm --cached .env.example

echo.
echo Committing changes...
git commit -m "Remove environment template files with sensitive data"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Environment files removed from Git
echo ========================================
echo.
echo Note: Files still exist locally, just removed from Git
pause
