import {
	addRoute,
	navigateTo,
	setTitle,
	type RouteHandlerParams,
	type RouteHandlerReturn,
} from "@app/routing";
import Cookie from "js-cookie";
import authHtml from "./login.html?raw";
import client from "@app/api";
import cuteCat from "./cuteCat.png";
import loggedInHtml from "./alreadyLoggedin.html?raw";
import totpHtml from "./totp.html?raw";
import { ensureWindowState, isNullish } from "@app/utils";
import { showError, showInfo, showSuccess } from "@app/toast";
import { updateUser } from "@app/auth";

const TOTP_LENGTH = 6;
ensureWindowState();
window.__state.lastAuthChange = Date.now();

async function handleOtp(
	app: HTMLElement,
	token: string,
	returnTo: string | null,
) {
	app.innerHTML = totpHtml;

	const container = app.querySelector("#totp-container")!;
	container.innerHTML = "";

	const inputs: HTMLInputElement[] = [];

	for (let i = 0; i < TOTP_LENGTH; i++) {
		const input = document.createElement("input");
		input.maxLength = 1;
		input.inputMode = "numeric";
		input.className =
			"w-12 h-12 text-center text-xl border border-gray-300 rounded " +
			"focus:outline-none focus:ring-2 focus:ring-blue-500";

		container.appendChild(input);
		inputs.push(input);

		// Handle typing a digit
		input.addEventListener("input", async () => {
			const value = input.value.replace(/\D/g, "");
			input.value = value;

			// Auto-advance when filled
			if (value && i < TOTP_LENGTH - 1) {
				inputs[i + 1].focus();
			}
			await checkComplete();
		});

		// Handle backspace
		input.addEventListener("keydown", (e) => {
			if (e.key === "Backspace" && !input.value && i > 0) {
				inputs[i - 1].focus();
			}
		});

		// Handle pasting a full code
		input.addEventListener("paste", (e: ClipboardEvent) => {
			const pasted = e.clipboardData?.getData("text") ?? "";
			const digits = pasted.replace(/\D/g, "").slice(0, TOTP_LENGTH);

			if (digits.length > 1) {
				e.preventDefault();
				digits.split("").forEach((d, idx) => {
					if (inputs[idx]) inputs[idx].value = d;
				});
				if (digits.length === TOTP_LENGTH) checkComplete();
			}
		});
	}

	// Check if all digits are entered and then call totpSend
	async function checkComplete() {
		const code = inputs.map((i) => i.value).join("");
		if (code.length === TOTP_LENGTH && /^[0-9]+$/.test(code)) {
			let res = await client.loginOtp({
				loginOtpRequest: {
					code,
					token,
				},
			});

			if (res.kind === "success") {
				window.__state.lastAuthChange = Date.now();
				Cookie.set("token", res.payload.token, {
					path: "/",
					sameSite: "lax",
				});
				navigateTo(returnTo ?? "/");
			} else if (res.kind === "failed") {
				showError(`Failed to authenticate`);
			}
		}
	}
	inputs[0].focus();
}

async function handleLogin(
	_url: string,
	_args: RouteHandlerParams,
): Promise<RouteHandlerReturn> {
	setTitle("Login");
	let user = await updateUser();
	const urlParams = new URLSearchParams(window.location.search);
	const returnTo = urlParams.get("returnTo");
	if (user !== null) {
		return {
			html: loggedInHtml,
			postInsert: async (app) => {
				const bLogoutButton =
					app?.querySelector<HTMLButtonElement>("button#bLogout");
				if (isNullish(bLogoutButton))
					return showError("Error while rending page");
				const iCuteCat =
					app?.querySelector<HTMLImageElement>("img#cuteCatImage");
				if (isNullish(iCuteCat))
					return showError("Error while rending page");
				const bReturnTo =
					app?.querySelector<HTMLButtonElement>("button#bReturnTo");
				if (isNullish(bReturnTo))
					return showError("Error while rending page");
				iCuteCat.src = cuteCat;
				iCuteCat.hidden = false;
				bLogoutButton.addEventListener("click", async () => {
					await client.logout();
					navigateTo("/login");
				});
				if (returnTo !== null) {
					bReturnTo.parentElement!.hidden = false;
					bReturnTo.addEventListener("click", async () => {
						navigateTo(returnTo ?? "/");
					});
				}
			},
		};
	}
	return {
		html: authHtml,
		postInsert: async (app) => {
			const aHref =
				app?.querySelector<HTMLAnchorElement>('a[href="/signin"]');
			if (!isNullish(aHref) && returnTo !== null) {
				aHref.href = `/signin?returnTo=${encodeURI(returnTo)}`;
			}
			const fLogin =
				document.querySelector<HTMLFormElement>("form#login-form");
			if (fLogin === null)
				return showError(
					"Error while rendering the page: no form found",
				);
			fLogin.addEventListener("submit", async function(e: SubmitEvent) {
				e.preventDefault();
				let form = e.target as HTMLFormElement | null;
				if (form === null) return showError("Failed to send form...");
				let formData = Object.fromEntries(new FormData(form).entries());
				if (
					!("login" in formData) ||
					typeof formData["login"] !== "string" ||
					(formData["login"] as string).length === 0
				)
					return showError("Please enter a Login");
				if (
					!("password" in formData) ||
					typeof formData["password"] !== "string" ||
					(formData["password"] as string).length === 0
				)
					return showError("Please enter a Password");
				try {
					const res = await client.login({
						loginRequest: {
							name: formData.login,
							password: formData.password,
						},
					});
					switch (res.kind) {
						case "success": {
							window.__state.lastAuthChange = Date.now();
							Cookie.set("token", res.payload.token, {
								path: "/",
								sameSite: "lax",
							});
							let user = await updateUser();
							if (user === null)
								return showError(
									"Failed to get user: no user ?",
								);
							setTitle(
								`Welcome ${user.guest ? "[GUEST] " : ""}${user.name}`,
							);
							navigateTo(returnTo ?? "/");
							break;
						}
						case "otpRequired": {
							return await handleOtp(
								app!,
								res.payload.token,
								returnTo,
							);
						}
						case "failed": {
							showError(`Failed to login: ${res.msg}`);
						}
					}
				} catch (e) {
					console.error("Login error:", e);
					showError("Failed to login: Unknown error");
				}
			});

			const bLoginAsGuest =
				document.querySelector<HTMLButtonElement>("#bGuestLogin");
			bLoginAsGuest?.addEventListener("click", async () => {
				try {
					const res = await client.guestLogin({
						guestLoginRequest: { name: undefined },
					});
					switch (res.kind) {
						case "success": {
							window.__state.lastAuthChange = Date.now();
							Cookie.set("token", res.payload.token, {
								path: "/",
								sameSite: "lax",
							});
							let user = await updateUser();
							if (user === null)
								return showError(
									"Failed to get user: no user ?",
								);
							setTitle(
								`Welcome ${user.guest ? "[GUEST] " : ""}${user.name}`,
							);
							navigateTo(returnTo ?? "/");
							break;
						}
						case "failed": {
							showError(`Failed to login: ${res.msg}`);
						}
					}
				} catch (e) {
					console.error("Login error:", e);
					showError("Failed to login: Unknown error");
				}
			});

			const dOtherLoginArea =
				document.querySelector<HTMLDivElement>("#otherLogin");
			if (dOtherLoginArea) {
				let styleSheetElement = document.createElement("style");
				styleSheetElement.innerText = "";
				const providersReq = await client.providerList();
				const providers = providersReq.payload.list;
				/*const providers: Providers[] = [
					{ name: 'discord', display_name: 'Discord', color: { default: 'bg-[#5865F2]', hover: '#FF65F2' } },
					{ name: 'kanidm', display_name: 'Kanidm', color: { default: 'bg-red-500', hover: 'bg-red-700' } },
					{ name: 'google', display_name: 'Google' },
				]*/
				let first = true;
				for (const p of providers) {
					let b = document.createElement("button");
					if (first && providers.length % 2)
						b.classList.add("last:col-span-2");
					first = false;
					b.classList.add(
						..."w-full text-white font-medium py-2 rounded-xl transition".split(
							" ",
						),
					);
					b.classList.add(`providerButton-${p.name}`);

					const col = p.colors;

					for (const k of Object.keys(col)) {
						let c = (col as any)[k].trim();
						if (c.startsWith("bg-")) {
							c = c.replace(/^bg-/, "");
							const customProp = c.match(/^\((.+)\)$/);
							const customVal = c.match(/^\[(.+)\]$/);

							if (customProp) c = `var(${customProp[1]})`;
							else if (customVal) c = customVal[1];
							else if (c === "inherit") c = "inherit";
							else if (c === "current") c = "currentColor";
							else if (c === "transparent") c = "transparent";
							else c = `var(--color-${c})`;
						}
						(col as any)[k] = c;
					}

					styleSheetElement.innerText += `.providerButton-${p.name} { background-color: ${col.normal}; }\n`;
					styleSheetElement.innerText += `.providerButton-${p.name}:hover { background-color: ${col.hover}; }\n`;

					b.dataset.display_name = p.displayName;
					b.dataset.name = p.name;
					//if (p.icon_url) b.dataset.icon = p.icon_url;

					b.innerHTML = `<span class="">${p.displayName}</span>`;
					b.addEventListener("click", () => {
						location.href = `/api/auth/oauth2/${p.name}/login`;
					});

					dOtherLoginArea.insertAdjacentElement("afterbegin", b);
				}
				app?.appendChild(styleSheetElement);
			}
		},
	};
}

addRoute("/login", handleLogin, { bypass_auth: true });
