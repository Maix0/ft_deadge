//! Anything in this file shouldn't be used...
//!
//! This file is here because it is easier to share code in here.

import { FastifyInstance } from "fastify";
import type { Database } from "@shared/database"
import { UserId } from "../database/mixin/user";

export default {};


class OTP {
	private db: Database;
	private static EPOCH: number = 0;
	private static KEY_SIZE: number = 64;
	private static TIME_STEP: number = 30;

	constructor(db: Database) {
		this.db = db;
	}

	private static Now(): number {
		return Math.floor(Date.now() / 1000)
	}

	private static getT(): number {
		return Math.floor((OTP.Now() - this.EPOCH) / this.TIME_STEP)
	}

	public verify(userid: UserId, code: string): boolean {
		return true;
	}

	public newUser(userid: UserId): string {
		return "super topt secret";
	}

	public generate(userid: UserId): string | null {
		let secret = this.db.getUserOTPSecret(userid);

		return null
	}
}
