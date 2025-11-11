#!/bin/sh

set -e
set -x
# do anything here

    mkdir -p /volumes/static/chat/

    cp -r /extra/chat.html /volumes/static/chat/chat.html

    cp -r /extra/chat.js /volumes/static/chat/chat.js
    cp -r /extra/style.css /volumes/static/chat/style.css


# chmod -R a+r /volumes/static/chat || true

# run the CMD [ ... ] from the dockerfile
exec "$@"
