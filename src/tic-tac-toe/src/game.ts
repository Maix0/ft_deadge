// import type { TicTacToeData } from '@shared/database/mixin/tictactoe';

// Represents the possible states of a cell on the board.
// `null` means that the cell is empty.
type CellState = 'O' | 'X' | null

export class TTC {
	private isGameOver: boolean = false;
	public board: CellState[] = Array(9).fill(null);
	private currentPlayer: 'O' | 'X' = 'X';

	private changePlayer() {
		this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
	}

	// Analyzes the current board to determine if the game has ended.
	private checkState(): 'winX' | 'winO' | 'draw' | 'ongoing' {
		const checkRow = (row: number): ('X' | 'O' | null) => {
			if (this.board[row * 3] === null) {return null;}
			if (this.board[row * 3] === this.board[row * 3 + 1] && this.board[row * 3 + 1] === this.board[row * 3 + 2]) {return this.board[row * 3];}
			return null;
		};

		const checkCol = (col: number): ('X' | 'O' | null) => {
			if (this.board[col] === null) return null;

			if (this.board[col] === this.board[col + 3] && this.board[col + 3] === this.board[col + 6]) {return this.board[col];}
			return null;
		};

		const checkDiag = (): ('X' | 'O' | null) => {
			if (this.board[4] === null) return null;

			if (this.board[0] === this.board[4] && this.board[4] === this.board[8]) {return this.board[4];}

			if (this.board[2] === this.board[4] && this.board[4] === this.board[6]) {return this.board[4];}
			return null;
		};


		const row = (checkRow(0) ?? checkRow(1)) ?? checkRow(2);
		const col = (checkCol(0) ?? checkCol(1)) ?? checkCol(2);
		const diag = checkDiag();

		if (row !== null) return `win${row}`;
		if (col !== null) return `win${col}`;
		if (diag !== null) return `win${diag}`;

		if (this.board.filter(c => c === null).length === 0) {return 'draw';}
		return 'ongoing';
	}

	public reset(): void {
		this.board = [null, null, null, null, null, null, null, null, null];
		this.currentPlayer = 'X';
		this.isGameOver = false;
	};

	// Attempts to place the current player's mark on the specified cell.
	// @param idx - The index of the board (0-8) to place the mark.
	// @returns The resulting game state, or `invalidMove` if the move is illegal.
	public makeMove(idx: number): 'winX' | 'winO' | 'draw' | 'ongoing' | 'invalidMove' {
		if (this.isGameOver) {
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

		const result = this.checkState();

		if (result !== 'ongoing') {
			this.isGameOver = true;
		}

		return result;
	}
}
