// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   database.ts                                        :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/17 17:06:31 by maiboyer          #+#    #+#             //
//   Updated: 2025/06/17 17:27:42 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import sqlite from 'better-sqlite3'

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
	export interface FastifyInstance {
		database: sqlite.Database;
	}
}

export type DatabaseOption = {
	path: string;
};

export const uDatabase = fp<DatabaseOption>(async function(
	_fastify: FastifyInstance,
	_options: DatabaseOption) {
});

export default uDatabase;

