#!/bin/sh

kibana_setup() {
	set -xe
	until curl -s -f "localhost:5601/api/status"; do
		sleep 2
	done

	curl -v -X POST "localhost:5601/api/saved_objects/_import?overwrite=true" \
		-H "kbn-xsrf: true" \
		--form file='@/setup/export.ndjson'
	exit 0
}
kibana_setup &
exec /usr/local/bin/kibana-docker
