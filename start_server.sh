#!/bin/bash
cd /workspaces/vetshub/pwa-simple-app
echo "Starting server from: $(pwd)"
echo "Index.html exists: $(ls index.html 2>/dev/null && echo 'YES' || echo 'NO')"
python3 -m http.server 8080