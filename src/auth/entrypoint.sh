#!/bin/sh

set -e
set -x
# do anything here

mkdir -p /volumes/static/auth/
cp -r /extra/login_demo.html /volumes/static/auth/index.html

# run the CMD [ ... ] from the dockerfile
exec "$@"
