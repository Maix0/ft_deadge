import { Configuration, OpenapiOtherApi } from './generated';
export * from './generated'


const basePath = (() => {
  let u = new URL(location.href);
  u.pathname = "";
  u.hash = "";
  u.search = "";
  return u.toString().replace(/\/+$/, '');

})();

export const client = new OpenapiOtherApi(new Configuration({ basePath }));
export default client;


