import { ensureWindowState } from '@app/utils';
import { Configuration, OpenapiOtherApi } from './generated';
export * from './generated'

ensureWindowState();

declare module 'ft_state' {
	interface State {
		client: OpenapiOtherApi;
	}
}

const basePath = (() => {
	let u = new URL(location.href);
	u.pathname = "";
	u.hash = "";
	u.search = "";
	return u.toString().replace(/\/+$/, '');
})();

export const client = new OpenapiOtherApi(new Configuration({ basePath }));
export default client;

window.__state.client ??= client;
