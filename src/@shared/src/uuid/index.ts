// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   index.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/20 17:41:01 by maiboyer          #+#    #+#             //
//   Updated: 2025/07/30 16:08:19 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { uuidv7 } from "uuidv7";

export class InvalidUUID extends Error {
	public readonly type = 'invalid-uuid';
};

// A UUID is a all lowercase string that looks like this:
// `xxxxxxxx-xxxx-7xxx-xxx-xxxxxxxxxxxx`
// where x is any hex number
//
// it is a unique identifier, where when created can be assumed to be unique 
// (aka no checks are needed)
//
// this uses the v7 of UUID, which means that every uuid is part random,
// part based on the timestamp it was Created
// 
// This allows better ergonomics as you can "see" which uuid are older 
// and which one are newer.
// This also makes sure that random UUID don't collide (unless you go back in time...).
export type UUIDv7 = string & { readonly __brand: unique symbol };

const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUIDv7(value: string): value is UUIDv7 {
	return uuidv7Regex.test(value);
}

//export function toUUIDv7(value: string): Result<UUIDv7, InvalidUUID> {
//	if (!isUUIDv7(value)) return Result.error(new InvalidUUID());
//
//	return Result.ok(value.toLowerCase() as UUIDv7);
//}

export function newUUIDv7(): UUIDv7 {
	return uuidv7() as UUIDv7;
}
