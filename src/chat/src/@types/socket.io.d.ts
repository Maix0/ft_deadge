import { type UserId } from '@shared/database/mixin/user';

declare module 'socket.io'
{
	interface Socket {
		authUser: {
			id: UserId;
			name: string;
			guest: boolean;
		}
	}
};
