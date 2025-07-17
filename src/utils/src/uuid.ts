// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   uuid.ts                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/20 17:41:01 by maiboyer          #+#    #+#             //
//   Updated: 2025/06/20 17:44:29 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { Result } from "typescript-result";
import { uuidv7 } from "uuidv7";

export class InvalidUUID extends Error {
	public readonly type = 'invalid-uuid';
};

export type UUIDv7 = string & { readonly __brand: unique symbol };
const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUIDv7(value: string): value is UUIDv7 {
	return uuidv7Regex.test(value);
}

export function toUUIDv7(value: string): Result<UUIDv7, InvalidUUID> {
	if (!isUUIDv7(value)) return Result.error(new InvalidUUID());

	return Result.ok(value as UUIDv7);
}

export function newUUIDv7(): UUIDv7 {
	return uuidv7() as UUIDv7;
}
