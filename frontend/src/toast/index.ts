type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
	message: string;
	type: ToastType;
	el: HTMLElement;
}

class ToastManager {
	private container: HTMLElement;
	private toasts: Toast[] = [];


	private static INSTANCE: ToastManager = new ToastManager();
	public static instance(): ToastManager { return ToastManager.INSTANCE; }

	private constructor() {
		// Create container at bottom center
		this.container = document.createElement('div');
		this.container.className = `
      fixed bottom-5 left-1/2 transform -translate-x-1/2 
      flex flex-col-reverse items-center gap-2 z-50
    `;
		document.body.appendChild(this.container);
	}

	public show(message: string, type: ToastType = 'info', duration = 5000) {
		const el = document.createElement('div');

		const color = {
			success: 'bg-green-600',
			error: 'bg-red-600',
			info: 'bg-blue-600',
			warning: 'bg-yellow-600 text-black'
		}[type];

		el.className = `
      toast-item min-w-[200px] max-w-sm px-4 py-2 rounded-xl shadow-lg
      text-white text-sm font-medium opacity-0 translate-y-4
      transition-all duration-300 ease-out ${color}
    `;
		el.innerText = message;

		this.container.prepend(el);

		// Animate in
		requestAnimationFrame(() => {
			el.classList.remove('opacity-0', 'translate-y-4');
			el.classList.add('opacity-100', 'translate-y-0');
		});
		let toast: Toast = { message, type, el };
		this.toasts.push(toast)
		setTimeout(() => this.remove(toast), duration);
	}


	private remove(toast: Toast) {
		const el = toast.el;
		if (toast) {
			// Animate out
			el.classList.add('opacity-0', 'translate-y-4');
			setTimeout(() => el.remove(), 300);
		}
		this.toasts = this.toasts.filter(t => t !== toast);
	}

}

// Export a singleton
export const toast = ToastManager.instance();
export default toast;

export function showError(message: string, duration: number = 5000) { toast.show(message, 'error', duration); }
export function showWarn(message: string, duration: number = 5000) { toast.show(message, 'warning', duration); }

export function showInfo(message: string, duration: number = 5000) { toast.show(message, 'info', duration); }
export function showSuccess(message: string, duration: number = 5000) { toast.show(message, 'success', duration); }

Object.assign((window as any), { toast, showError, showWarn, showInfo, showSuccess })
