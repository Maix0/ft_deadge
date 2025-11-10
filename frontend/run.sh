#!/bin/sh

set -x
set -e

rm -rf /volumes/static/app
mkdir -p /volumes/static/app

cp -r /dist/* /volumes/static/app/
