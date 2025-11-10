export function escapeHTML(str: string): string {
	const p = document.createElement("p");
	p.appendChild(document.createTextNode(str));
	return p.innerHTML;
}
export function isNullish<T>(v: T | undefined | null): v is (null | undefined) {
	return v === null || v === undefined;
}
