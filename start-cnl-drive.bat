@echo off

timeout /t 20 /nobreak >nul


cd /d "C:\Users\pc\Desktop\cnl-files-management"
set NODE_ENV=production
npm start
