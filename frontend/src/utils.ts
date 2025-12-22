export function escapeHTML(str: string): string {
	const p = document.createElement("p");
	p.appendChild(document.createTextNode(str));
	return p.innerHTML;
}
export function isNullish<T>(v: T | undefined | null): v is (null | undefined) {
	return v === null || v === undefined;
}

// MAKE SURE YOU DO WANT TO CALL THIS FUNCTION
export function ensureWindowState() {
	window.__state = window.__state ?? {};
}
