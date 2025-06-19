// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   database.ts                                        :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/17 17:06:31 by maiboyer          #+#    #+#             //
//   Updated: 2025/06/20 00:11:43 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import sqlite from 'better-sqlite3'

import initSql from "./init.sql.js"

export class Database {
  private db: sqlite.Database;

  constructor(db_path: string) {
    this.db = sqlite(db_path, {});
    this.db.pragma('journal_mode = WAL');
    this.db.exec(initSql);
  }

  destroy(): void {
    this.db?.close();
  }

}

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    db: Database;
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

