import { UserId } from '@shared/database/mixin/user';

export class Paddle {
	public static readonly DEFAULT_SPEED = 20;
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
	public static readonly DEFAULT_SPEED = 1;
	public static readonly DEFAULT_SIZE = 16;
	public static readonly DEFAULT_MAX_SPEED = 30;
	public static readonly DEFAULT_MIN_SPEED = Ball.DEFAULT_SPEED;
	public static readonly DEFAULT_ACCEL_FACTOR = 1.2;

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
	) {
		// this.speed *= this.accel_factor;
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
		this[c] =
			walls[side] +
			this.size * (side === 'right' || side === 'bottom' ? -1 : 1);

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

export class Pong {
	public gameUpdate: NodeJS.Timeout | null = null;


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
	public ball: Ball = new Ball(Pong.GAME_WIDTH / 2, Pong.GAME_HEIGHT / 2, Pong.BALL_START_ANGLES[this.ballAngleIdx++]);

	public score: [number, number] = [0, 0];

	constructor(
		public userLeft: UserId,
		public userRight: UserId,
	) {
	}

	public tick() {
		if (this.paddleCollision(this.leftPaddle, 'left')) {
			this.ball.collided('left', {
				left: this.leftPaddle.x + this.leftPaddle.width,
				right: 0,
				top: 0,
				bottom: 0,
			});
			return;
		}
		if (this.paddleCollision(this.rightPaddle, 'right')) {
			this.ball.collided('right', {
				right: this.rightPaddle.x,
				left: 0,
				top: 0,
				bottom: 0,
			});
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
		// now we check only if the ball is near enought in the y axis to permform the collision
		if (!(
			// check if ball is bellow the top of the paddle
			paddle.y - this.ball.size < this.ball.y &&
			// check if ball is above the bottom of the paddle
			this.ball.y < paddle.y + paddle.height + this.ball.size)) return false;

		// so we know that the y is close enougth to be a bit, so we check the X. are we closer than the ball size ? if yes -> hit
		if (
			// check if the paddle.x is at most ball.size away from the center of the ball => we have a hit houston
			// call he pentagon, 9 11
			Math.abs(
				paddle.x + paddle.width * (side === 'left' ? 1 : 0)
				- this.ball.x)
			< this.ball.size
		) return true;
		return false;
	}

	public checkWinner(): 'left' | 'right' | null {
		if (this.score[0] >= 5) return 'left';
		if (this.score[1] >= 5) return 'right';
		return null;
	}

	public movePaddle(user: UserId, dir: 'up' | 'down') {
		const paddle =
			user === this.userLeft
				? this.leftPaddle
				: user == this.userRight
					? this.rightPaddle
					: null;
		if (paddle === null) return;
		paddle.move(dir);
		paddle.clamp(0, Pong.GAME_HEIGHT);
	}
}
