import './carousel.css'

const menuBtn = document.querySelector<HTMLButtonElement>('#menuBtn')!;
const sidebar = document.querySelector('#sidebar')!;
const overlay = document.querySelector('#overlay')!;

menuBtn.addEventListener('click', () => {
	sidebar.classList.toggle('-translate-x-full')
	overlay.classList.toggle('opacity-0');
	overlay.classList.toggle('pointer-events-none');
	menuBtn.classList.toggle('flipped');
});

overlay.addEventListener('click', () => {
	sidebar.classList.add('-translate-x-full');
	overlay.classList.add('opacity-0', 'pointer-events-none');
});
