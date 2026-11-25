@echo off
echo ==========================================================
echo   NEXGEN CODE - Pushing Backend and Frontend to GitHub
echo ==========================================================

echo.
echo [1/2] Pushing Backend to https://github.com/krishnaprakash287/krishnacodebackend...
cd /d "c:\Users\HP\Desktop\nexgencode\repo_push"
git push origin main
if %ERRORLEVEL% equ 0 (
    echo [Backend SUCCESS] Pushed successfully to GitHub!
) else (
    echo [Backend Alert] Could not push. Please check your GitHub login.
)

echo.
echo [2/2] Pushing Frontend to https://github.com/guy395800-alt/krishnacode...
cd /d "c:\Users\HP\Desktop\nexgencode\frontend_push"
git push origin main
if %ERRORLEVEL% equ 0 (
    echo [Frontend SUCCESS] Pushed successfully to GitHub!
) else (
    echo [Frontend Alert] Could not push. Please check your GitHub login.
)

echo.
echo ==========================================================
echo   Finished! Render will automatically rebuild and deploy.
echo ==========================================================
pause
