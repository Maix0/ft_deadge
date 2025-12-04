#!/bin/sh

set -e
set -x

# run the CMD [ ... ] from the dockerfile
exec "$@"
