import { UserId } from '@shared/database/mixin/user';
import { randomInt } from 'crypto';

export class Paddle {
	public static readonly DEFAULT_SPEED = 10;
	public static readonly DEFAULT_HEIGHT = 80;
	public static readonly DEFAULT_WIDTH = 12;

	public height: number = Paddle.DEFAULT_HEIGHT;
	public width: number = Paddle.DEFAULT_WIDTH;
	public speed: number = Paddle.DEFAULT_SPEED;

	constructor(
		// these coordiantes are the topleft corordinates
		public x: number,
		public y: number,
	) { }

	public move(dir: 'up' | 'down') {
		this.y += (dir === 'up' ? -1 : 1) * this.speed;
	}

	public clamp(bottom: number, top: number) {
		if (this.y <= bottom) this.y = bottom;
		if (this.y + this.height >= top) this.y = top - this.height;
	}
}

class Ball {
	public static readonly DEFAULT_SPEED = 3;
	public static readonly DEFAULT_SIZE = 16;
	public static readonly DEFAULT_MAX_SPEED = 15;
	public static readonly DEFAULT_MIN_SPEED = Ball.DEFAULT_SPEED;
	public static readonly DEFAULT_ACCEL_FACTOR = 1.1;

	public speed: number = Ball.DEFAULT_SPEED;
	public size: number = Ball.DEFAULT_SIZE;
	public accel_factor: number = Ball.DEFAULT_ACCEL_FACTOR;

	public max_speed: number = Ball.DEFAULT_MAX_SPEED;
	public min_speed: number = Ball.DEFAULT_MIN_SPEED;

	constructor(
		// these coordiantes are the center coordinates
		public x: number,
		public y: number,
		public angle: number,
	) { }

	public collided(
		side: 'left' | 'right' | 'top' | 'bottom',
		walls: { [k in typeof side]: number },
		snap: boolean = true,
	) {
		this.speed *= this.accel_factor;
		this.speed = Math.max(
			Math.min(this.speed, this.max_speed),
			this.min_speed,
		);

		let c: 'x' | 'y' = 'x';
		if (side === 'top' || side === 'bottom') {
			this.angle = -this.angle;
			c = 'y';
		}
		else {
			this.angle = -this.angle + Math.PI;
			c = 'x';
		}
		if (snap) {
			this[c] =
				walls[side] +
				this.size * (side === 'right' || side === 'bottom' ? -1 : 1);
		}

		while (this.angle >= Math.PI) {
			this.angle -= 2 * Math.PI;
		}
		while (this.angle < -Math.PI) {
			this.angle += 2 * Math.PI;
		}
	}

	public tick() {
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
	}
}

function makeAngle(i: number): [number, number, number, number] {
	return [
		Math.PI / i,
		Math.PI / i + Math.PI,
		-Math.PI / i,
		-Math.PI / i + Math.PI,
	];
}
const LEFT :number	= 0;
const RIGHT :number	= 1;

export class Pong {

	public gameUpdate: NodeJS.Timeout | null = null;

	public static readonly CONCEDED_TIMEOUT: number = 1500;

	public static readonly BALL_START_ANGLES: number[] = [
		...makeAngle(4),
		...makeAngle(6),
	];

	public ballAngleIdx: number = 0;

	public static readonly GAME_WIDTH: number = 800;
	public static readonly GAME_HEIGHT: number = 450;

	public static readonly PADDLE_OFFSET: number = 40;

	public leftPaddle: Paddle = new Paddle(
		Pong.PADDLE_OFFSET,
		(Pong.GAME_HEIGHT - Paddle.DEFAULT_HEIGHT) / 2,
	);
	public rightPaddle: Paddle = new Paddle(
		Pong.GAME_WIDTH - Pong.PADDLE_OFFSET - Paddle.DEFAULT_WIDTH,
		(Pong.GAME_HEIGHT - Paddle.DEFAULT_HEIGHT) / 2,
	);
	public ball: Ball = new Ball(
		Pong.GAME_WIDTH / 2,
		Pong.GAME_HEIGHT / 2,
		Pong.BALL_START_ANGLES[this.ballAngleIdx++],
	);

	public	sendSig	: boolean = false;
	public	ready_checks: [boolean, boolean] = [false, false];
	public	rdy_timer	: number = Date.now();

	public score: [number, number] = [0, 0];
	public local: boolean = false;

	public rightLastSeen: number = -1;
	public leftLastSeen: number = -1;

	private cachedWinner: 'left' | 'right' | null = null;

	public static makeLocal(owner: UserId): Pong {
		const game = new Pong(owner, owner);
		game.local = true;
		return game;
	}

	constructor(
		public userLeft: UserId,
		public userRight: UserId,
	) { }

	public readyup(uid : UserId) {
		if (uid === this.userLeft) {
			this.ready_checks[LEFT] = true;
		}
		if (uid === this.userRight) {
			this.ready_checks[RIGHT] = true;
		}
	}
	public readydown(uid : UserId) {
		// is everyone already ready?
		if (this.ready_checks[LEFT] === true && this.ready_checks[RIGHT] === true) return ;

		if (uid === this.userLeft) { this.ready_checks[LEFT] = false; }
		if (uid === this.userRight) { this.ready_checks[RIGHT] = false; }
	}

	public tick() {
		if (!this.local && (this.ready_checks[LEFT] !== true || this.ready_checks[RIGHT] !== true)) { return;}
		if (this.paddleCollision(this.leftPaddle, 'left')) {
			this.ball.collided(
				'left',
				{
					left: this.leftPaddle.x + this.leftPaddle.width,
					right: 0,
					top: 0,
					bottom: 0,
				},
				false,
			);
			return;
		}
		if (this.paddleCollision(this.rightPaddle, 'right')) {
			this.ball.collided(
				'right',
				{
					right: this.rightPaddle.x,
					left: 0,
					top: 0,
					bottom: 0,
				},
				false,
			);
			return;
		}
		const wallCollision = this.boxCollision();
		if (wallCollision === 'top' || wallCollision === 'bottom') {
			this.ball.collided(wallCollision, {
				left: 0,
				top: 0,
				bottom: Pong.GAME_HEIGHT,
				right: Pong.GAME_WIDTH,
			});
		}
		else if (wallCollision !== null) {
			const idx = wallCollision === 'left' ? 1 : 0;
			this.score[idx] += 1;
			this.ball = new Ball(
				Pong.GAME_WIDTH / 2,
				Pong.GAME_HEIGHT / 2,
				Pong.BALL_START_ANGLES[this.ballAngleIdx++],
			);
			this.ballAngleIdx %= Pong.BALL_START_ANGLES.length;
		}
		this.ball.tick();
	}

	// This function will return which side the ball collided, if any
	private boxCollision(): 'top' | 'bottom' | 'left' | 'right' | null {
		if (this.ball.y - this.ball.size <= 0) return 'top';
		if (this.ball.y + this.ball.size >= Pong.GAME_HEIGHT) return 'bottom';
		if (this.ball.x - this.ball.size <= 0) return 'left';
		if (this.ball.x + this.ball.size >= Pong.GAME_WIDTH) return 'right';
		return null;
	}

	private paddleCollision(paddle: Paddle, side: 'left' | 'right'): boolean {
		if (
			(Math.abs(this.ball.angle) > Math.PI / 2 && side !== 'left') ||
			(Math.abs(this.ball.angle) < Math.PI / 2 && side !== 'right')
		) {
			return false;
		}

		// now we check only if the ball is near enought in the y axis to permform the collision
		if (
			!(
				// check if ball is bellow the top of the paddle
				(
					paddle.y - this.ball.size < this.ball.y &&
					// check if ball is above the bottom of the paddle
					this.ball.y < paddle.y + paddle.height + this.ball.size
				)
			)
		) {
			return false;
		}

		// so we know that the y is close enougth to be a bit, so we check the X. are we closer than the ball size ? if yes -> hit
		if (
			// check if the paddle.x is at most ball.size away from the center of the ball => we have a hit houston
			Math.abs(
				paddle.x +
				paddle.width * (side === 'left' ? 1 : 0) -
				this.ball.x,
			) < this.ball.size
		) {
			return true;
		}
		return false;
	}

	public updateLastSeen(user: UserId) {
		if (this.local && this.userLeft === user) {
			this.leftLastSeen = Date.now();
			this.rightLastSeen = Date.now();
		}
		else if (this.userLeft === user) {
			this.leftLastSeen = Date.now();
		}
		else if (this.userRight === user) {
			this.rightLastSeen = Date.now();
		}
	}

	public checkWinner(): 'left' | 'right' | null {
		const checkInner = () => {
			if (this.score[LEFT] >= 5) return 'left';
			if (this.score[RIGHT] >= 5) return 'right';

			if (this.local !== true && this.rdy_timer !== -1 && Date.now() - this.rdy_timer > Pong.CONCEDED_TIMEOUT * 10 && (!this.ready_checks[0] || !this.ready_checks[1])) {
				if (!this.ready_checks[0] && !this.ready_checks[1]) return (randomInt(1) == 1 ? 'left' : 'right');
				if (!this.ready_checks[0]) return ('right');
				if (!this.ready_checks[1]) return ('left');
			}
			if (this.leftLastSeen !== -1 && Date.now() - this.leftLastSeen > Pong.CONCEDED_TIMEOUT) { return 'right';}
			if (this.rightLastSeen !== -1 && Date.now() - this.rightLastSeen > Pong.CONCEDED_TIMEOUT) {	return 'left';}

			return null;
		};
		if (this.cachedWinner === null) {
			this.cachedWinner = checkInner();
		}
		return this.cachedWinner;
	}

	public movePaddle(user: UserId | ('left' | 'right'), dir: 'up' | 'down') {
		let paddle: Paddle | null = null;
		if (this.local) {
			if (user === 'left') {
				paddle = this.leftPaddle;
			}
			else if (user === 'right') {
				paddle = this.rightPaddle;
			}
		}
		else if (user === this.userLeft) {
			paddle = this.leftPaddle;
		}
		else if (user === this.userRight) {
			paddle = this.rightPaddle;
		}
		if (paddle === null) return;
		paddle.move(dir);
		paddle.clamp(0, Pong.GAME_HEIGHT);
	}
}
