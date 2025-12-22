import { type State } from "ft_state";

interface CustomEventMap {
	"ft:pageChange": CustomEvent<{}>;
}

declare global {
	interface Document {
		//adds definition to Document, but you can do the same with HTMLElement
		addEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Document, ev: CustomEventMap[K]) => void,
		): void;
		dispatchEvent<K extends keyof CustomEventMap>(
			ev: CustomEventMap[K],
		): void;
	}
}

declare global {
	interface Window {
		__state: State;
	}
}

export { }; //keep that for TS compiler.

