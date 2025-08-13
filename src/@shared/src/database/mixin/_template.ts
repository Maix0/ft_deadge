//import sqlite from "better-sqlite3"
import { MixinBase } from "./_base"

// never use this directly
export const TemplateDb = function <TBase extends MixinBase>(Base: TBase) {
	return class extends Base {
		constructor(...args: any[]) {
			if (args.length != 1 && !(args[0] instanceof String))
				throw "Invalid arguments to mixing class"
			super(args[0]);
		}
	}
}

export type TemplateId = number & { readonly __brand: unique symbol };

export type TemplateType = {
	readonly id: TemplateId,
	readonly field: string,
	readonly field2: number,
};
