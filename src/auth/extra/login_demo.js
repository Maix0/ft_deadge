const headers = {
	'Accept': 'application/json',
	'Content-Type': 'application/json',
};

const tUsername = document.querySelector('#t-username');

const iUsername = document.querySelector('#i-username');
const iPassword = document.querySelector('#i-password');
const iOtp = document.querySelector('#i-otp');

const bOtpSend = document.querySelector('#b-otpSend');
const bLogin = document.querySelector('#b-login');
const bLogout = document.querySelector('#b-logout');
const bSignin = document.querySelector('#b-signin');
const bWhoami = document.querySelector('#b-whoami');

const bOtpStatus = document.querySelector('#b-otpStatus');
const bOtpEnable = document.querySelector('#b-otpEnable');
const bOtpDisable = document.querySelector('#b-otpDisable');

const dResponse = document.querySelector('#d-response');

function setResponse(obj) {
	const obj_str = JSON.stringify(obj, null, 4);
	dResponse.innerText = obj_str;
}
let otpToken = null;

bOtpSend.addEventListener('click', async () => {
	const res = await fetch('/api/auth/otp', { method: 'POST', body: JSON.stringify({ code: iOtp.value, token: otpToken }), headers });
	const json = await res.json();

	setResponse(json);
	if (json.kind === 'success') {
		if (json?.payload?.token) {document.cookie = `token=${json?.payload?.token}`;}
	}
});

bOtpStatus.addEventListener('click', async () => {
	const res = await fetch('/api/auth/statusOtp');
	const json = await res.json();

	setResponse(json);
});

bOtpEnable.addEventListener('click', async () => {
	const res = await fetch('/api/auth/enableOtp', { method: 'PUT' });
	const json = await res.json();

	setResponse(json);
});

bOtpDisable.addEventListener('click', async () => {
	const res = await fetch('/api/auth/disableOtp', { method: 'PUT' });
	const json = await res.json();

	setResponse(json);
});

bWhoami.addEventListener('click', async () => {
	let username = '';
	try {
		const res = await fetch('/api/auth/whoami');
		const json = await res.json();
		setResponse(json);
		if (json?.kind === 'success') {username = json?.payload?.name;}
		else {username = `<not logged in:${json.msg}>`;}
	}
	catch {
		username = '<not logged in: threw>';
	}
	tUsername.innerText = username;
});

bLogin.addEventListener('click', async () => {
	const name = iUsername.value;
	const password = iPassword.value;

	const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ name, password }), headers });
	const json = await res.json();
	if (json?.kind === 'otpRequired') {
		otpToken = json?.payload?.token;
	}
	else if (json?.kind === 'success') {
		if (json?.payload?.token) {document.cookie = `token=${json?.payload?.token}`;}
	}
	setResponse(json);
});

bLogout.addEventListener('click', async () => {
	const res = await fetch('/api/auth/logout', { method: 'POST' });
	setResponse(await res.json());
});

bSignin.addEventListener('click', async () => {
	const name = iUsername.value;
	const password = iPassword.value;

	const res = await fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ name, password }), headers });
	const json = await res.json();
	if (json?.payload?.token) {document.cookie = `token=${json?.payload?.token};`;}
	setResponse(json);
});
