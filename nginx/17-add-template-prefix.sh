#!/bin/sh

set -e

ME=$(basename "$0")

entrypoint_log() {
	if [ -z "${NGINX_ENTRYPOINT_QUIET_LOGS:-}" ]; then
		echo "$@"
	fi
}

auto_template() {
	local template_dir="${NGINX_ENVSUBST_TEMPLATE_DIR:-/etc/nginx/templates}"
	local suffix="${NGINX_ENVSUBST_TEMPLATE_SUFFIX:-.template}"

	[ -d "$template_dir" ] || return 0
	if [ ! -w "$template_dir" ]; then
		entrypoint_log "$ME: ERROR: $template_dir exists, but is not writable"
		return 0
	fi
	find "$template_dir" -follow -type f -name '*.conf' -print | while read -r template; do
		entrypoint_log "$ME: adding $suffix to $template"
		mv "$template" "$template$suffix"
	done
}

auto_template

exit 0
