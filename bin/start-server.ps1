$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
uv run uvicorn app.main:app --reload --host 0.0.0.0
