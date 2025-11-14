#!/bin/sh

setup_ilm() {
	set -xe
	until curl -s -f http://localhost:9200 >/dev/null; do
		sleep 2;
	done;

	curl -v -X PUT "localhost:9200/_ilm/policy/docker-logs-policy" \
		-H "Content-Type: application/json" \
		-d '@/setup/docker-logs-policy.json'
	curl -v -X PUT "localhost:9200/_template/docker-logs-template" \
		-H "Content-Type: application/json" \
		-d '@/setup/docker-logs-template.json'
	exit 0
}

setup_ilm &
exec /usr/local/bin/docker-entrypoint.sh eswrapper
