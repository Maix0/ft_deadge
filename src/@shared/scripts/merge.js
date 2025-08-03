#!/usr/bin/env node

import fs from 'node:fs/promises'

const merge_json = (prev, cur) => {
	const keys = ["dependencies", "devDependencies"];
	const out = {};

	for (let k of keys)
		out[k] = Object.assign(prev[k] ?? {}, cur[k] ?? {});
	return out;
};

const promises = process.argv.slice(2).map(f => fs.readFile(f, { encoding: "utf8" }));
const jsons = (await Promise.all(promises)).map(JSON.parse);
const deps = jsons.reduce(merge_json, {});

const out = Object.assign(deps, {
	private: true,
	name: "stub",
});

console.log(JSON.stringify(out));
