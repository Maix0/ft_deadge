//! Anything in this file shouldn't be used...
//!
//! This file is here because it is easier to share code in here.

import type { Database } from "@shared/database";
import type { UserId } from "../database/mixin/user";
import OTP, * as OtpModules from "otp";

let secret = "JKZSGXRCBP3UHOFVDVLYQ3W43IZH3D76";
let otp = new OTP({ secret, name: "test" });

console.log(`${otp.totpURL}`);
console.log(new URL(otp.totpURL));
setInterval(() => {
	console.log(`${otp.totp(Date.now())}`);
}, 999);
