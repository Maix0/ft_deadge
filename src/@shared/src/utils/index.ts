import {
	Parameters,
	Static,
	TEnum,
	TSchema,
	Type,
	TProperties,
	TObject,
} from 'typebox';
import { FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export const useMonitoring = fp(async (fastify) => {
	fastify.get('/monitoring', { schema: { hide: true } }, (req, res) => {
		void req;
		res.code(200).send('Ok');
	});
});

const kMakeResponseSym = Symbol('make-response-sym');
declare module 'fastify' {
	export interface RouteOptions {
		[kMakeResponseSym]: boolean;
	}
}
export const useMakeResponse = fp(async (fastify, opts) => {
	void opts;

	fastify.decorateReply('makeResponse', makeResponse);
});

export type MakeStaticResponse<T extends { [k: string]: TSchema }> = {
	[k in keyof T]: Static<T[k]>;
};

declare module 'fastify' {
	interface FastifyReply {
		/**
		 * @description Builds a response from a `kind`, `key` and an arbitrary payload
		 *
		 * * USE THIS FUNCTION TO ALLOW GREPING :) *
		 *
		 * @example makeResponse("failure", "login.failure.invalid")
		 * @example makeResponse("success", "login.success", { token: "supersecrettoken" })
		 */
		makeResponse<T extends object>(
			status: Parameters<FastifyReply['code']>[0],
			kind: string,
			key: string,
			payload?: T,
		): ReturnType<FastifyReply['send']>;
	}
}

function makeResponse<T extends object>(
	this: FastifyReply,
	status: Parameters<FastifyReply['code']>[0],
	kind: string,
	key: string,
	payload?: T,
): ReturnType<FastifyReply['send']> {
	this.log.info(`Sending response: ${status}; response = ${JSON.stringify({ kind, msg: key, payload })}`);
	return this.code(status).send({ kind, msg: key, payload });
}

/**
 * @description Create a typebox Type for a response.
 *
 * @example typeResponse("failure", ["login.failure.invalid", "login.failure.generic", "login.failure.missingPassword"])
 * @example typeResponse("otpRequired", "login.otpRequired", { token: Type.String() })
 * @example typeResponse("success", "login.success", { token: Type.String() })
 */
export function typeResponse<K extends string, M extends string>(
	kind: K,
	key: M,
): TObject<{
	kind: TEnum<[K]>;
	msg: TEnum<M[]>;
}>;
export function typeResponse<K extends string, M extends string[]>(
	kind: K,
	key: [...M],
): TObject<{
	kind: TEnum<K[]>;
	msg: TEnum<M>;
}>;
export function typeResponse<
	K extends string,
	M extends string,
	T extends TProperties,
>(
	kind: K,
	key: M,
	payload: T,
): TObject<{
	kind: TEnum<[K]>;
	msg: TEnum<M[]>;
	payload: TObject<T>;
}>;
export function typeResponse<
	K extends string,
	M extends string[],
	T extends TProperties,
>(
	kind: K,
	key: [...M],
	payload: T,
): TObject<{
	kind: TEnum<[K]>;
	msg: TEnum<M>;
	payload: TObject<T>;
}>;
export function typeResponse<K extends string, T extends TProperties>(
	kind: K,
	key: unknown,
	payload?: T,
): unknown {
	const tKey = Type.Enum(Array.isArray(key) ? key : [key]);

	const Ty = {
		kind: Type.Enum([kind]),
		msg: tKey,
	};
	if (payload !== undefined) {
		Object.assign(Ty, { payload: Type.Object(payload) });
	}

	return Type.Object(Ty);
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
export function isNullish<T>(v: T | undefined | null): v is null | undefined {
	return v === null || v === undefined;
}
