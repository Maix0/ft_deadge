#!/bin/sh

set -e
set -x
# do anything here

mkdir -p /volumes/static/auth/
cp -r /extra/login_demo.html /volumes/static/auth/index.html
cp -r /extra/login_demo.js /volumes/static/auth/login_demo.js

# run the CMD [ ... ] from the dockerfile
exec "$@"
