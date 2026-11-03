@echo off
title AttendEase - Student Attendance System
echo =========================================================
echo   Starting AttendEase Production Backend Server
echo =========================================================

if exist "%~dp0.runtime\node-v20.18.0-win-x64\node.exe" (
  "%~dp0.runtime\node-v20.18.0-win-x64\node.exe" src/server.js
) else (
  node src/server.js
)

pause

