@echo off
echo ========================================
echo Fixing Git Push (Removing Secrets)
echo ========================================
echo.

echo Step 1: Remove .env.production from Git...
git rm --cached .env.production

echo.
echo Step 2: Commit the changes...
git add .gitignore
git commit --amend -m "Fix deployment: MongoDB Atlas + production config (without secrets)"

echo.
echo Step 3: Force push to GitHub...
git push -u origin main --force

echo.
echo ========================================
echo Done! Backend pushed successfully
echo ========================================
echo.
echo IMPORTANT: Now set environment variables in Render dashboard
echo Go to: https://dashboard.render.com
echo.
pause
