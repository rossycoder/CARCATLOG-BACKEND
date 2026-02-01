@echo off
echo ========================================
echo Pushing Backend Fixes to GitHub
echo ========================================
echo.

echo Adding changes...
git add controllers/advertController.js
git add server.js
git add .gitignore

echo.
echo Committing...
git commit -m "Fix: Add timeout for API calls and better error handling"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Done! Wait 2-3 minutes for Render to redeploy
echo ========================================
pause
