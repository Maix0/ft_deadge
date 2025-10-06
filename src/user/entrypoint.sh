#!/bin/sh

set -e
set -x
# do anything here

# run the CMD [ ... ] from the dockerfile
exec "$@"
