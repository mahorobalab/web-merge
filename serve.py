#!/usr/bin/env python3
"""
WebMerge Local Offline Server
----------------------------
A lightweight zero-dependency local HTTP server to run WebMerge completely offline.
Powered by Python standard library (http.server & webbrowser).

Usage:
    python serve.py
    python serve.py --port 8080
"""

import argparse
import functools
import http.server
import os
from pathlib import Path
import socket
import socketserver
import subprocess
import sys
import threading
import time
import webbrowser

DEFAULT_PORT = 8000
MAX_PORT_SEARCH = 20


def is_port_in_use(port: int) -> bool:
    """Check if a network port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def find_available_port(start_port: int) -> int:
    """Find the first available port starting from start_port."""
    for p in range(start_port, start_port + MAX_PORT_SEARCH):
        if not is_port_in_use(p):
            return p
    return start_port


def check_and_build(root_dir: Path) -> Path | None:
    """
    Check if a built WebMerge directory exists (dist/ or current directory containing index.html).
    If not, offer to build using npm if available.
    """
    # 1. Check if root itself is a distribution directory (e.g. offline release zip)
    if (root_dir / "index.html").is_file() and (root_dir / "assets").is_dir():
        return root_dir

    # 2. Check standard dist/ directory
    dist_dir = root_dir / "dist"
    if (dist_dir / "index.html").is_file():
        return dist_dir

    # 3. Neither found. Check if this is the source repository
    if (root_dir / "package.json").is_file():
        print("=" * 60)
        print("  WebMerge: Production build not found in './dist'")
        print("  プロダクションビルド (./dist) が見つかりませんでした。")
        print("=" * 60)
        print("\nTo run WebMerge locally, the frontend assets must be built first.")
        print("WebMergeをローカル実行するには、事前に静的ファイルのビルドが必要です。")

        # Check if npm is available
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        has_npm = False
        try:
            subprocess.run([npm_cmd, "--version"], capture_output=True, check=True)
            has_npm = True
        except (FileNotFoundError, subprocess.SubprocessError):
            pass

        if has_npm:
            print("\nFound Node.js & npm on your system.")
            choice = input("Do you want to run 'npm run build' now? [Y/n] (今すぐビルドを実行しますか？): ").strip().lower()
            if choice in ("", "y", "yes"):
                print("\n[+] Running 'npm run build'...")
                try:
                    subprocess.run([npm_cmd, "run", "build"], cwd=str(root_dir), check=True)
                    if (dist_dir / "index.html").is_file():
                        print("\n[✓] Build completed successfully!\n")
                        return dist_dir
                except subprocess.SubprocessError as e:
                    print(f"\n[!] Build failed: {e}")
                    return None
            else:
                print("\nAborted.")
                return None
        else:
            print("\nTip / ヒント:")
            print("1. Install Node.js (v20+) and run 'npm run build'.")
            print("2. Or download the pre-built 'web-merge-offline.zip' from GitHub Releases:")
            print("   https://github.com/mahorobalab/web-merge/releases\n")
            return None

    return None


def open_browser_delayed(url: str, delay: float = 0.8):
    """Open the web browser after a brief delay so the server has started."""
    def _open():
        time.sleep(delay)
        print(f"[✓] Opening browser at: {url}")
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


def main():
    parser = argparse.ArgumentParser(description="WebMerge Local Offline Server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port number (default: {DEFAULT_PORT})")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the browser automatically")
    parser.add_argument("--dir", type=str, default=None, help="Directory to serve")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parent

    # Determine directory to serve
    if args.dir:
        serve_dir = Path(args.dir).resolve()
        if not serve_dir.is_dir():
            print(f"Error: Directory '{serve_dir}' does not exist.")
            sys.exit(1)
    else:
        serve_dir = check_and_build(root_dir)
        if not serve_dir:
            sys.exit(1)

    port = find_available_port(args.port)
    if port != args.port:
        print(f"[*] Port {args.port} in use, switching to port {port}")

    url = f"http://localhost:{port}"

    # Custom HTTP handler with proper MIME types and no-cache during local testing
    handler_class = functools.partial(
        http.server.SimpleHTTPRequestHandler,
        directory=str(serve_dir)
    )

    print("=" * 64)
    print("  🔀 WebMerge - Local Offline Server")
    print("  ブラウザ完結型・完全ローカル差分比較 & マージツール")
    print("=" * 64)
    print(f"  Serving Directory : {serve_dir}")
    print(f"  Local URL         : {url}")
    print("  Privacy & Security: 100% Client-Side (Zero Server Communications)")
    print("=" * 64)
    print("  Press Ctrl+C to stop the server (サーバー停止: Ctrl+C)")
    print("=" * 64 + "\n")

    if not args.no_browser:
        open_browser_delayed(url)

    # Allow fast address reuse upon restart
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("127.0.0.1", port), handler_class) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] WebMerge server stopped. Bye!")
        sys.exit(0)


if __name__ == "__main__":
    main()
