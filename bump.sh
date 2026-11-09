#!/bin/sh
# Bumps the app version so phones always pick up the new code. Run before each deploy.
cd "$(dirname "$0")"
n=$(grep -o 'app.js?v=[0-9]*' index.html | grep -o '[0-9]*$'); m=$((n+1))
sed -i "s/app.js?v=$n/app.js?v=$m/" index.html sw.js
sed -i "s/the365-v$n\"/the365-v$m\"/" sw.js
echo "version $m"
