#!/bin/sh

set -e
set -x
# do anything here

cp -r /extra /files

# run the CMD [ ... ] from the dockerfile
exec "$@"
