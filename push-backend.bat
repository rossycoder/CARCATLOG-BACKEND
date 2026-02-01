@echo off
echo ========================================
echo Setting up Backend Git Remote
echo ========================================
echo.

echo Adding remote repository...
git remote add origin https://github.com/rossycoder/CARCATLOG-BACKEND.git

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Backend pushed to GitHub
echo ========================================
pause
