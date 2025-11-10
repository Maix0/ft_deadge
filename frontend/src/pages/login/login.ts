import { addRoute, setTitle, type RouteHandlerParams, type RouteHandlerReturn } from "@app/routing";
import { showError, showInfo, showSuccess } from "@app/toast";
import authHtml from './login.html?raw';
import client from '@app/api'
import { updateUser } from "@app/auth";


type Providers = {
  name: string,
  display_name: string,
  icon_url?: string,
  color?: { default: string, hover: string },
};

function handleLogin(_url: string, _args: RouteHandlerParams): RouteHandlerReturn {
  setTitle('Login')
  return {
    html: authHtml, postInsert: async (app) => {
      const fLogin = document.querySelector<HTMLFormElement>('form#login-form');
      if (fLogin === null)
        return showError('Error while rendering the page: no form found');
      showSuccess('got the form !')
      fLogin.addEventListener('submit', async function(e: SubmitEvent) {
        e.preventDefault();
        let form = e.target as (HTMLFormElement | null)
        if (form === null)
          return showError('Failed to send form...');
        let formData = Object.fromEntries((new FormData(form)).entries());
        if (!('login' in formData) || typeof formData['login'] !== 'string' || (formData['login'] as string).length === 0)
          return showError('Please enter a Login');
        if (!('password' in formData) || typeof formData['password'] !== 'string' || (formData['password'] as string).length === 0)
          return showError('Please enter a Password');
        try {
          const res = await client.login({ loginRequest: { name: formData.login, password: formData.password } });
          switch (res.kind) {
            case 'success': {
              document.cookie = `token=${res.payload.token}`;
              let user = await updateUser();
              if (user === null)
                return showError('Failed to get user: no user ?');
              setTitle(`Welcome ${user.guest ? '[GUEST] ' : ''}${user.name}`);
              break;
            }
            case 'otpRequired': {
              showInfo('Got ask OTP, not yet implemented');
              break;
            }
            case 'failed': {
              showError(`Failed to login: ${res.msg}`);
            }
          }
        } catch (e) {
          console.error("Login error:", e);
          showError('Failed to login: Unknown error');
        }
      });

      const bLoginAsGuest = document.querySelector<HTMLButtonElement>('#bGuestLogin');
      bLoginAsGuest?.addEventListener('click', async () => {
        try {
          const res = await client.guestLogin();
          switch (res.kind) {
            case 'success': {
              document.cookie = `token=${res.payload.token}`;
              let user = await updateUser();
              if (user === null)
                return showError('Failed to get user: no user ?');
              setTitle(`Welcome ${user.guest ? '[GUEST] ' : ''}${user.name}`);
              break;
            }
            case 'failed': {
              showError(`Failed to login: ${res.msg}`);
            }
          }
        } catch (e) {
          console.error("Login error:", e);
          showError('Failed to login: Unknown error');
        }
      });

      const dOtherLoginArea = document.querySelector<HTMLDivElement>('#otherLogin');
      if (dOtherLoginArea) {
        let styleSheetElement = document.createElement('style');
        styleSheetElement.innerText = "";
        // TODO: fetch all the providers from an API ?
        const providers: Providers[] = [
          { name: 'discord', display_name: 'Discord', color: { default: 'bg-[#5865F2]', hover: '#FF65F2' } },
          { name: 'kanidm', display_name: 'Kanidm', color: { default: 'bg-red-500', hover: 'bg-red-700' } },
          { name: 'google', display_name: 'Google' },
        ]
        let first = true;
        for (const p of providers) {
          let b = document.createElement('button');
          if (first) b.classList.add('last:col-span-2');
          first = false;
          b.classList.add(...(
            'w-full text-white font-medium py-2 rounded-xl transition'
              .split(' ')
          ));
          b.classList.add(`providerButton-${p.name}`)

          const col = { default: p.color?.default ?? "bg-gray-600", hover: p.color?.hover ?? "bg-gray-700" };

          for (const k of Object.keys(col)) {
            let c = (col as { [k: string]: string })[k].trim();
            if (c.startsWith('bg-')) {
              c = c.replace(/^bg-/, '');
              const customProp = c.match(/^\((.+)\)$/);
              const customVal = c.match(/^\[(.+)\]$/);

              if (customProp)
                c = `var(${customProp[1]})`
              else if (customVal)
                c = customVal[1];
              else if (c === 'inherit')
                c = 'inherit';
              else if (c === 'current')
                c = 'currentColor';
              else if (c === 'transparent')
                c = 'transparent';
              else
                c = `var(--color-${c})`

            }
            (col as { [k: string]: string })[k] = c;
          }

          styleSheetElement.innerText += `.providerButton-${p.name} { background-color: ${col.default}; }\n`;
          styleSheetElement.innerText += `.providerButton-${p.name}:hover { background-color: ${col.hover}; }\n`;

          b.dataset.display_name = p.display_name;
          b.dataset.name = p.name;
          if (p.icon_url) b.dataset.icon = p.icon_url;

          b.innerHTML = `
          ${p.icon_url ? `<img src="${p.icon_url}" alt="${p.display_name} Logo" />` : ''} <span class="">${p.display_name}</span>
          `
          b.addEventListener('click', () => {
            location.href = `/api/auth/oauth2/${p.name}/login`;
          })

          dOtherLoginArea.insertAdjacentElement('afterbegin', b);
        }
        app?.appendChild(styleSheetElement);
      }
    }
  };

}


addRoute('/login', handleLogin, { bypass_auth: true })
