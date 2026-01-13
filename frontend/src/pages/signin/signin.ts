import { addRoute, setTitle, navigateTo, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError, showInfo, showSuccess } from "@app/toast";
import page from './signin.html?raw';
import client from '@app/api'
import { updateUser } from "@app/auth";
import Cookie from 'js-cookie';
import loggedInHtml from './alreadyLoggedin.html?raw';
import { isNullish } from "@app/utils";
import cuteCat from './cuteCat.png';

const MSG_KEY_TO_STRING = {
	'signin.failed.username.existing': 'Username already exists',
	'signin.failed.username.toolong': 'Username is too short',
	'signin.failed.username.tooshort': 'Username is too long',
	'signin.failed.username.invalid': 'Username is invalid',
	'signin.failed.password.toolong': 'Password is too long',
	'signin.failed.password.tooshort': 'Password is too short',
	'signin.failed.password.invalid': 'Password is invalid',
	'signin.failed.generic': 'Unknown Error',
};

async function handleSignin(_url: string, _args: RouteHandlerParams): Promise<RouteHandlerReturn> {
	setTitle('Signin')
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
					navigateTo("/signin");
				});
				if (returnTo !== null) {
					bReturnTo.parentElement!.hidden = false;
					bReturnTo.addEventListener("click", async () => {
						if (returnTo !== null) navigateTo(returnTo);
					});
				}
			},
		};
	}

	return {
		html: page, postInsert: async (app) => {
			const fSignin = document.querySelector<HTMLFormElement>('form#signin-form');
			if (fSignin === null)
				return showError('Error while rendering the page: no form found');
			fSignin.addEventListener('submit', async function(e: SubmitEvent) {
				e.preventDefault();
				let form = e.target as (HTMLFormElement | null);
				if (form === null)
					return showError('Failed to send form...');
				let formData = Object.fromEntries((new FormData(form)).entries());
				if (!('login' in formData) || typeof formData['login'] !== 'string' || (formData['login'] as string).length === 0)
					return showError('Please enter a Login');
				if (!('password' in formData) || typeof formData['password'] !== 'string' || (formData['password'] as string).length === 0)
					return showError('Please enter a Password');
				try {
					const res = await client.signin({ loginRequest: { name: formData.login, password: formData.password } });
					switch (res.kind) {
						case 'success': {
							Cookie.set('token', res.payload.token, { path: '/', sameSite: 'lax' });
							let user = await updateUser();
							if (user === null)
								return showError('Failed to get user: no user ?');
							navigateTo(returnTo !== null ? returnTo : '/')
							break;
						}
						case 'failed': {
							showError(`Failed to signin: ${MSG_KEY_TO_STRING[res.msg]}`);
						}
					}
				} catch (e) {
					console.error("Signin error:", e);
					showError('Failed to signin: Unknown error');
				}
			});
		}
	}
};


addRoute('/signin', handleSignin, { bypass_auth: true })
