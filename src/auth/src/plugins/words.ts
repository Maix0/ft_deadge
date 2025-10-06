// Why does this file exists ?
// We want to make random-ish username for the guest, but still reconizable usernames
// So we do `${adjective}_${nouns}`
// there is around 30k combinaison, so we should be fine :)

import fp from 'fastify-plugin';

// @ts-expect-error: Ts can't load raw txt files - vite does it
import _adjectives from './files/adjectives.txt?raw';
// @ts-expect-error: Ts can't load raw txt files - vite does it
import _nouns from './files/nouns.txt?raw';


type WordsCategory = 'adjectives' | 'nouns';
type Words = { [k in WordsCategory]: string[] };

function toTitleCase(str: string) {
	return str.replace(
		/\w\S*/g,
		text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
	);
}

// strong typing those import :)
const RAW_WORDS: { [k in WordsCategory]: string } = { adjectives: _adjectives, nouns: _nouns };
const WORDS: Words = Object.fromEntries(Object.entries(RAW_WORDS).map(([k, v]) => {
	const words = v.split('\n').map(s => s.trim()).filter(s => !(s.startsWith('#') || s.length === 0)).map(toTitleCase);
	return [k, words];
})) as Words;

export default fp<object>(async (fastify) => {
	fastify.decorate('words', WORDS);
});

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		words: Words;
	}
}
