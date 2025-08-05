import { Database } from "@shared/database";

export type UserID = Number & { readonly __brand: unique symbol };

export async function getUser(this: Database, id: UserID) {
	console.log(this);
}
