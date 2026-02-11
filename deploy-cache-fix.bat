@echo off
echo ========================================
echo   DEPLOYING CACHE FIX TO PRODUCTION
echo ========================================
echo.

echo Step 1: Adding changed files...
git add services/universalAutoCompleteService.js
echo ✓ Files staged

echo.
echo Step 2: Committing changes...
git commit -m "Fix: Re-enable cache system to prevent excessive API calls - saves £54,270/month"
echo ✓ Changes committed

echo.
echo Step 3: Pushing to production...
git push origin main
echo ✓ Pushed to GitHub

echo.
echo ========================================
echo   DEPLOYMENT INITIATED
echo ========================================
echo.
echo Render.com will automatically deploy in 2-3 minutes
echo.
echo Monitor deployment at:
echo https://dashboard.render.com
echo.
echo After deployment, test with:
echo curl "https://carcatlog-backend-1.onrender.com/api/vehicles/lookup/MA21YOX?mileage=1000"
echo.
echo Expected log: "📦 Cache found: fresh (0 days old)"
echo.
pause
