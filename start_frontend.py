"""Serve the static frontend locally. Uses only the Python standard library."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


def main():
    parser = ArgumentParser(description="Open the Clinic Booking frontend preview")
    parser.add_argument("--port", type=int, default=5500)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535")
    directory = Path(__file__).resolve().parent / "frontend"
    if not (directory / "index.html").is_file():
        parser.error("Cannot find frontend/index.html next to this launcher")
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as exc:
        print(f"Cannot start the preview: {exc}")
        print("Try: python start_frontend.py --port 5501")
        return 1
    url = f"http://127.0.0.1:{args.port}"
    with server:
        print(f"Clinic Booking frontend: {url}", flush=True)
        print("Preview data only. Press Ctrl+C to stop.", flush=True)
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except webbrowser.Error:
                print("Open the URL above in your browser.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nPreview stopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
