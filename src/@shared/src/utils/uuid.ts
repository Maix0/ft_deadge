import * as uuidv7 from 'uuidv7';

export type UUID = `${string}-${string}-${string}-${string}-${string}` & { readonly __brand: unique symbol };
export default UUID;

export function newUUID(): UUID {
	return uuidv7.uuidv7() as UUID;
}

export function isUUID(s: string): s is UUID {
	try {
		uuidv7.UUID.parse(s);
		return true;
	}
	catch {
		return false;
	}
}

export function parseUUID(s: string): UUID {
	return uuidv7.UUID.parse(s).toString() as UUID;
}
