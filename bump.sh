#!/bin/sh
# Gives the app's files a new version number so browsers always load the latest copy
V=$(date +%Y%m%d%H%M%S)
sed -i -E "s/(style\.css|config\.js|public\.js|app\.js)(\?v=[0-9]+)?\"/\1?v=$V\"/g" "$(dirname "$0")/index.html"
