#!/bin/bash
set -e

docker stop md-viewer-jenkins 2>/dev/null || true
sleep 2
docker rm -f md-viewer-jenkins 2>/dev/null || true
sleep 1

# Launch the app on port 5020
echo "=== Launching md-viewer on port 5020 ==="
docker run -d \
  --name md-viewer-jenkins \
  -p 5020:3000 \
  -v /home/frogg/projects/simple-md-viewer/docs:/app/docs:ro \
  --restart unless-stopped \
  simple-md-viewer

echo "App launched at http://localhost:5020"
echo "Dev URL: https://md.dev.frogg.app"
