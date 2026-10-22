#!/usr/bin/env bash
# ========================================================
# WebMerge - Quick Start Launcher (macOS / Linux)
# ========================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if command -v python3 &>/dev/null; then
    python3 serve.py "$@"
elif command -v python &>/dev/null; then
    python serve.py "$@"
else
    echo "[ERROR] Python 3 is not installed or not found in PATH."
    echo "Python 3 がインストールされていないか、PATH に通っていません。"
    echo "https://www.python.org/"
    exit 1
fi
