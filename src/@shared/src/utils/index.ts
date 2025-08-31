import { Type } from "@sinclair/typebox";

/**
 * @description Represent a message key
 * Used for translation of text, taken from a prebuilt dictionary
 * Format: `category.sub.desc`
 *
 * @example `login.failure.invalid`
 * @example `login.failure.missingPassword`
 * @example `login.failure.missingUser`
 * @example `signin.success`
 * @example `pong.you.lost`
 */
export type MessageKey = string;
export type ResponseBase<T = {}> = {
	kind: string,
	msg: MessageKey,
	payload?: T,
}

/**
 * @description Builds a response from a `kind`, `key` and an arbitrary payload
 * 
 * * USE THIS FUNCTION TO ALLOW GREPING :) *
 *
 * @example makeResponse("failure", "login.failure.invalid")
 * @example makeResponse("success", "login.success", { token: "supersecrettoken" })
 */
export function makeResponse<T = {}>(kind: string, key: MessageKey, payload?: T): ResponseBase<T> {
	console.log(`making response {kind: ${JSON.stringify(kind)}; key: ${JSON.stringify(key)}}`)
	return { kind, msg: key, payload }
}


/** 
 * @description Create a typebox Type for a response.
 * 
 * @example typeResponse("failure", ["login.failure.invalid", "login.failure.generic", "login.failure.missingPassword"])
 * @example typeResponse("otpRequired", "login.otpRequired", { token: Type.String() })
 * @example typeResponse("success", "login.success", { token: Type.String() })
 */
export function typeResponse(kind: string, key: MessageKey | MessageKey[], payload?: any): any {
	let tKey;
	if (key instanceof Array) {
		tKey = Type.Union(key.map(l => Type.Const(l)));
	} else {
		tKey = Type.Const(key);
	}

	const Ty = {
		kind: Type.Const(kind),
		msg: tKey,
	};
	if (payload !== undefined)
		Object.assign(Ty, { payload: Type.Object(payload) })

	return Type.Object(Ty)
}

/**
 * @description returns weither a value is null or undefined
 *
 * @example assert_equal(isNullish(null), true);
 * @example assert_equal(isNullish(undefined), true);
 * @example assert_equal(isNullish(0), false);
 * @example assert_equal(isNullish(""), false);
 * @example assert_equal(isNullish([]), false);
 * @example assert_equal(isNullish({}), false);
 * @example assert_equal(isNullish(false), false);
 */
export function isNullish<T>(v: T | undefined | null): v is (null | undefined) {
	return v === null || v === undefined
}
