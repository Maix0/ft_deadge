// import type { TicTacToeData } from '@shared/database/mixin/tictactoe';

import { TicTacToeOutcome } from '@shared/database/mixin/tictactoe';
import { UserId } from '@shared/database/mixin/user';

// Represents the possible states of a cell on the board.
// `null` means that the cell is empty.
type CellState = 'O' | 'X' | null

export class TTC {
	// 30s
	public static readonly TIMEOUT_INMOVE: number = 30 * 1000;
	// 1.5s
	public static readonly TIMEOUT_KEEPALIVE: number = 1.5 * 1000;

	private isGameOver: boolean = false;
	public board: CellState[] = Array(9).fill(null);
	private currentPlayer: 'O' | 'X' = 'X';

	public gameUpdate: NodeJS.Timeout | null = null;

	public lastMoveTime: number = -1;
	public lastSeenX: number = -1;
	public lastSeenO: number = -1;

	private changePlayer() {
		this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
		this.lastMoveTime = Date.now();
	}

	public constructor(public readonly playerX: UserId, public readonly playerO: UserId) { }


	private checkWinnerCache: TicTacToeOutcome | null = null;
	// Analyzes the current board to determine if the game has ended.
	public checkWinner(): TicTacToeOutcome | null {
		const real_func = (): (TicTacToeOutcome | null) => {
			if (this.lastMoveTime !== -1 && Date.now() - this.lastMoveTime > TTC.TIMEOUT_INMOVE) {
				if (this.currentPlayer === 'X') { return 'winO'; }
				else { return 'winX'; }
			}

			if (this.lastSeenX !== -1 && Date.now() - this.lastSeenX > TTC.TIMEOUT_KEEPALIVE) { return 'winO'; }
			if (this.lastSeenO !== -1 && Date.now() - this.lastSeenO > TTC.TIMEOUT_KEEPALIVE) { return 'winX'; }


			const checkRow = (row: number): ('X' | 'O' | null) => {
				if (this.board[row * 3] === null) { return null; }
				if (this.board[row * 3] === this.board[row * 3 + 1] && this.board[row * 3 + 1] === this.board[row * 3 + 2]) { return this.board[row * 3]; }
				return null;
			};

			const checkCol = (col: number): ('X' | 'O' | null) => {
				if (this.board[col] === null) return null;

				if (this.board[col] === this.board[col + 3] && this.board[col + 3] === this.board[col + 6]) { return this.board[col]; }
				return null;
			};

			const checkDiag = (): ('X' | 'O' | null) => {
				if (this.board[4] === null) return null;

				if (this.board[0] === this.board[4] && this.board[4] === this.board[8]) { return this.board[4]; }

				if (this.board[2] === this.board[4] && this.board[4] === this.board[6]) { return this.board[4]; }
				return null;
			};


			const row = (checkRow(0) ?? checkRow(1)) ?? checkRow(2);
			const col = (checkCol(0) ?? checkCol(1)) ?? checkCol(2);
			const diag = checkDiag();

			if (row !== null) return `win${row}`;
			if (col !== null) return `win${col}`;
			if (diag !== null) return `win${diag}`;

			if (this.board.filter(c => c === null).length === 0) { return 'draw'; }
			return null;
		};


		if (this.checkWinnerCache === null) {
			this.checkWinnerCache = real_func();
		}
		return this.checkWinnerCache;
	}

	public reset(): void {
		this.board = [null, null, null, null, null, null, null, null, null];
		this.currentPlayer = 'X';
		this.isGameOver = false;
	};

	// Attempts to place the current player's mark on the specified cell.
	// @param idx - The index of the board (0-8) to place the mark.
	// @returns The resulting game state, or `invalidMove` if the move is illegal.
	public makeMove(playerId: UserId, idx: number): 'success' | 'invalidMove' {
		const player = playerId == this.playerX ? 'X' : (
			playerId == this.playerO ? 'O' : null
		);

		if (player === null) return 'invalidMove';

		if (player !== this.currentPlayer || this.isGameOver) {
			return 'invalidMove';
		}
		if (idx < 0 || idx >= this.board.length) {
			return 'invalidMove';
		}
		if (this.board[idx] !== null) {
			return 'invalidMove';
		}
		this.board[idx] = this.currentPlayer;
		this.changePlayer();

		const result = this.checkWinner();

		if (result !== null) {
			this.isGameOver = true;
		}
		return 'success';

	}

	public updateKeepAlive(user: UserId) {
		if (user === this.playerX) { this.lastSeenX = Date.now(); }
		if (user === this.playerO) { this.lastSeenO = Date.now(); }
	}

	getCurrentState(): 'X' | 'O' { return this.currentPlayer; };
}
