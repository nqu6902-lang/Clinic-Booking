@echo off
setlocal
cd /d "%~dp0"
python "%~dp0start_frontend.py"
if errorlevel 1 (
  echo Please install Python 3 or run the command from your Python terminal.
  pause
)
