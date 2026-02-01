@echo off
echo ========================================
echo Pushing Backend Changes to GitHub
echo ========================================
echo.

echo Resetting previous commit...
git reset --soft HEAD~1

echo.
echo Adding only necessary files...
git add .gitignore
git add controllers/advertController.js
git add server.js
git add scripts/testDeployment.js
git add scripts/testMongoConnection.js
git add package.json

echo.
echo Committing changes...
git commit -m "Fix deployment: MongoDB Atlas connection + error logging"

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Backend changes pushed
echo ========================================
pause
