import type { BlockRelation} from './chat_types';

export function checkNamePair(list: BlockRelation[], name1: string, name2: string): (boolean) {
	const matches: BlockRelation[] = [];
	let exists: boolean = false;
	for (const item of list) {
		if (item.blocker === name1) {
			matches.push(item);
			if (item.blocked === name2) {
			  exists = true;
			  return true;;
			}
		}
	}
	return exists;
}