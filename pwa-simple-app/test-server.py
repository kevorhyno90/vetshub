#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the correct directory
os.chdir('/workspaces/vetshub/pwa-simple-app')

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='/workspaces/vetshub/pwa-simple-app', **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print(f"Serving from: {os.getcwd()}")
    print("Files in directory:")
    for f in os.listdir('.'):
        print(f"  {f}")
    httpd.serve_forever()