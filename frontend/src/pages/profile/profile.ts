import { addRoute, handleRoute, navigateTo, setTitle } from "@app/routing";
import { showError, showSuccess } from "@app/toast";
import page from "./profile.html?raw";
import { updateUser } from "@app/auth";
import { isNullish } from "@app/utils";
import client from "@app/api";
import QRCode from "qrcode";

/*
 * Renders an OAuth2-compatible TOTP QR code into a canvas.
 *
 * @param canvas  HTMLCanvasElement to draw into
 * @param secret  Base32-encoded shared secret
 * @param options Meta data for QR (label, issuer, etc.)
 */
export async function renderOAuth2QRCode(
	canvas: HTMLCanvasElement,
	secret: string,
): Promise<void> {
	// Encode the otpauth:// URL
	const otpauthUrl = new URL(`otpauth://totp/ft_boule:totp`);

	otpauthUrl.searchParams.set("secret", secret.replace(/=+$/, ""));
	otpauthUrl.searchParams.set("issuer", "ft_boule");

	// Render QR code into the canvas
	await QRCode.toCanvas(canvas, otpauthUrl.toString(), {
		margin: 1,
		scale: 5,
	});
	canvas.style.width = "";
	canvas.style.height = "";
}
function removeBgColor(...elem: HTMLElement[]) {
	for (let e of elem) {
		for (let c of e.classList.values()) {
			if (c.startsWith("bg-") || c.startsWith("hover:bg-"))
				e.classList.remove(c);
		}
	}
}

async function route(url: string, _args: { [k: string]: string }) {
	setTitle("Edit Profile");
	return {
		html: page,
		postInsert: async (app: HTMLElement | undefined) => {
			const user = await updateUser();
			if (isNullish(user)) return showError("No User");
			if (isNullish(app)) return showError("Failed to render");
			let totpState = await (async () => {
				let res = await client.statusOtp();
				if (res.kind === "success")
					return {
						enabled:
							(res.msg as string) === "statusOtp.success.enabled",
						secret:
							(res.msg as string) === "statusOtp.success.enabled"
								? res.payload.secret
								: null,
					};
				else {
					showError("Failed to get OTP status");
					return {
						enabled: false,
						secret: null,
					};
				}
			})();
			// ---- Simulated State ----
			let totpEnabled = totpState.enabled;
			let totpSecret = totpState.secret; // would come from backend

			let guestBox = app.querySelector<HTMLDivElement>("#isGuestBox")!;
			let displayNameWrapper = app.querySelector<HTMLDivElement>(
				"#displayNameWrapper",
			)!;
			let displayNameBox =
				app.querySelector<HTMLInputElement>("#displayNameBox")!;
			let displayNameButton =
				app.querySelector<HTMLButtonElement>("#displayNameButton")!;
			let loginNameWrapper =
				app.querySelector<HTMLDivElement>("#loginNameWrapper")!;
			let loginNameBox =
				app.querySelector<HTMLDivElement>("#loginNameBox")!;
			let passwordWrapper =
				app.querySelector<HTMLDivElement>("#passwordWrapper")!;
			let passwordBox =
				app.querySelector<HTMLInputElement>("#passwordBox")!;
			let passwordButton =
				app.querySelector<HTMLButtonElement>("#passwordButton")!;

			let providerWrapper =
				app.querySelector<HTMLDivElement>("#providerWrapper")!;
			let providerNameBox =
				app.querySelector<HTMLDivElement>("#providerNameBox")!;
			let providerUserBox =
				app.querySelector<HTMLDivElement>("#providerUserBox")!;

			let descWrapper =
				app.querySelector<HTMLDivElement>("#descWrapper")!;
			let descBox =
				app.querySelector<HTMLInputElement>("#descBox")!;
			let descButton =
				app.querySelector<HTMLButtonElement>("#descButton")!;

			let accountTypeBox =
				app.querySelector<HTMLDivElement>("#accountType")!;
			displayNameBox.value = user.name;

			guestBox.hidden = !user.guest;

			// ---- DOM Elements ----
			const totpStatusText = app.querySelector("#totpStatusText")!;
			const enableBtn =
				app.querySelector<HTMLButtonElement>("#enableTotp")!;
			const disableBtn =
				app.querySelector<HTMLButtonElement>("#disableTotp")!;
			const showSecretBtn =
				app.querySelector<HTMLButtonElement>("#showSecret")!;
			const secretBox = app.querySelector("#totpSecretBox")!;
			const secretText =
				app.querySelector<HTMLDivElement>("#totpSecretText")!;
			const secretCanvas =
				app.querySelector<HTMLCanvasElement>("#totpSecretCanvas")!;
			let totpWrapper =
				app.querySelector<HTMLDivElement>("#totpWrapper")!;

			descBox.value = user.desc;

			if (user.guest) {
				removeBgColor(
					passwordButton,
					displayNameButton,
					enableBtn,
					disableBtn,
					showSecretBtn,
					descButton,
				);

				descButton.classList.add(
					"bg-gray-700",
					"hover:bg-gray-700",
				);
				descButton.disabled = true;
				descBox.disabled = true;

				passwordButton.classList.add(
					"bg-gray-700",
					"hover:bg-gray-700",
				);

				passwordBox.disabled = true;
				passwordBox.classList.add("color-white");

				displayNameButton.disabled = true;
				displayNameButton.classList.add("bg-gray-700", "color-white");

				displayNameBox.disabled = true;
				displayNameBox.classList.add("color-white");
				enableBtn.classList.add("bg-gray-700", "hover:bg-gray-700");
				disableBtn.classList.add("bg-gray-700", "hover:bg-gray-700");
				showSecretBtn.classList.add("bg-gray-700", "hover:bg-gray-700");

				enableBtn.disabled = true;
				disableBtn.disabled = true;
				showSecretBtn.disabled = true;

				accountTypeBox.innerText = "Guest";
			} else if (!isNullish(user.selfInfo?.loginName)) {
				loginNameWrapper.hidden = false;
				loginNameBox.innerText = user.selfInfo.loginName;
				totpWrapper.hidden = false;
				passwordWrapper.hidden = false;

				accountTypeBox.innerText = "Normal";
			} else if (
				!isNullish(user.selfInfo?.providerId) &&
				!isNullish(user.selfInfo?.providerUser)
			) {
				providerWrapper.hidden = false;
				providerNameBox.innerText = user.selfInfo.providerId;
				providerUserBox.innerText = user.selfInfo.providerUser;

				enableBtn.classList.add("bg-gray-700", "hover:bg-gray-700");
				disableBtn.classList.add("bg-gray-700", "hover:bg-gray-700");
				showSecretBtn.classList.add("bg-gray-700", "hover:bg-gray-700");

				enableBtn.disabled = true;
				disableBtn.disabled = true;
				showSecretBtn.disabled = true;

				removeBgColor(enableBtn, disableBtn, showSecretBtn);
				passwordWrapper.hidden = true;
				totpWrapper.hidden = true;

				accountTypeBox.innerText = "Provider";
			}

			// ---- Update UI ----
			function refreshTotpUI() {
				if (totpEnabled) {
					totpStatusText.textContent = "Status: Enabled";

					enableBtn.classList.add("hidden");
					disableBtn.classList.remove("hidden");
					showSecretBtn.classList.remove("hidden");
				} else {
					totpStatusText.textContent = "Status: Disabled";

					enableBtn.classList.remove("hidden");
					disableBtn.classList.add("hidden");
					showSecretBtn.classList.add("hidden");
					secretBox.classList.add("hidden");
				}
			}

			// ---- Button Events ----
			enableBtn.onclick = async () => {
				let res = await client.enableOtp();
				if (res.kind === "success") {
					navigateTo(url);
				} else {
					showError(`failed to activate OTP`);
				}
			};

			disableBtn.onclick = async () => {
				let res = await client.disableOtp();
				if (res.kind === "success") {
					navigateTo(url);
				} else {
					showError(`failed to deactivate OTP`);
				}
			};

			showSecretBtn.onclick = () => {
				if (!isNullish(totpSecret)) {
					secretText.textContent = totpSecret;
					renderOAuth2QRCode(secretCanvas, totpSecret);
				}
				secretBox.classList.toggle("hidden");
			};

			displayNameButton.onclick = async () => {
				let req = await client.changeDisplayName({
					changeDisplayNameRequest: {
						name: displayNameBox.value,
					},
				});
				if (req.kind === "success") {
					showSuccess("Successfully changed display name");
					handleRoute();
				} else {
					showError(`Failed to update`);
				}
			};
			passwordButton.onclick = async () => {
				let req = await client.changePassword({
					changePasswordRequest: {
						newPassword: passwordBox.value,
					},
				});
				if (req.kind === "success") {
					showSuccess("Successfully changed password");
					handleRoute();
				} else {
					showError(`Failed to update`);
				}
			};
			descButton.onclick = async () => {
				let req = await client.changeDesc({ changeDescRequest: { desc: descBox.value } });
				if (req.kind === "success") {
					showSuccess("Successfully changed description");
					handleRoute();
				}
				else {
					showError(`Failed to update`);
				}
			};

			// Initialize UI state
			refreshTotpUI();
		},
	};
}

addRoute("/profile", route);
