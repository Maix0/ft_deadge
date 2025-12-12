import { addRoute, setTitle, type RouteHandlerReturn } from "@app/routing";
import tttPage from "./ttt.html?raw";
import { showError, showInfo, showSuccess } from "@app/toast";

// Represents the possible states of a cell on the board.
// `null` means that the cell is empty.
type CellState = 'O' | 'X' | null

// Encapsulates the game logic.
class TTC {

    private isGameOver: boolean;

    private board: [
        CellState, CellState, CellState,
        CellState, CellState, CellState,
        CellState, CellState, CellState];
    private currentPlayer: 'O' | 'X';
    
    constructor() {
        this.board = [null,null,null,null,null,null,null,null,null];
        this.isGameOver = false;
        this.currentPlayer = 'X';
    }

    private changePlayer()
    {
        if (this.currentPlayer === 'X')
            this.currentPlayer = 'O';
        else 
            this.currentPlayer = 'X';
    }

    // Analyzes the current board to determine if the game has ended.
    private checkState(): 'winX' | 'winO' | 'draw' | 'ongoing'
    {
        const checkRow = (row: number): ('X' | 'O' | null) =>  {
            if (this.board[row * 3] === null)
                return null;
            if (this.board[row * 3] === this.board[row * 3 + 1] && this.board[row * 3 + 1] === this.board[row * 3 + 2])
                return this.board[row * 3];
            return null;
        }

        const checkCol = (col: number): ('X' | 'O' | null) => {
            if (this.board[col] === null) return null;

            if (this.board[col] === this.board[col + 3] && this.board[col + 3] === this.board[col + 6])
                return this.board[col];
            return null;
        }

        const checkDiag = (): ('X' | 'O' | null) => {
            if (this.board[4] === null) return null

            if (this.board[0] === this.board[4] && this.board[4] === this.board[8]) 
                return this.board[4]

            if (this.board[2] === this.board[4] && this.board[4] === this.board[6]) 
                return this.board[4]
            return null;
        }

        
        const row = (checkRow(0) ?? checkRow(1)) ?? checkRow(2);
        const col = (checkCol(0) ?? checkCol(1)) ?? checkCol(2);
        const diag = checkDiag();

        if (row !== null) return `win${row}`;
        if (col !== null) return `win${col}`;
        if (diag !== null ) return `win${diag}`;

        if (this.board.filter(c => c === null).length === 0)
            return 'draw';
        return 'ongoing';
    }

    public reset(): void {
      this.board = [null,null,null,null,null,null,null,null,null];
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

    public getBoard(): [
        CellState, CellState, CellState,
        CellState, CellState, CellState,
        CellState, CellState, CellState]
    {
        return this.board;
    }
}

// Route handler for the Tic-Tac-Toe page.
// Instantiates the game logic and binds UI events.
async function handleTTT(): Promise<RouteHandlerReturn>
{
    // Create a fresh instance for every page load.
    let board = new TTC();

    return {
        html: tttPage,
        postInsert: async (app) => {
            if (!app) {
                return;
            }

            const cells = app.querySelectorAll<HTMLDivElement>(".ttt-grid-cell");
            const restartBtn = app.querySelector<HTMLButtonElement>("#ttt-restart-btn");

            const updateUI = () => {
              const board_state = board.getBoard();
              board_state.forEach((cell_state, cell_idx) => {
                 cells[cell_idx].innerText = cell_state !== null ? cell_state : " ";
              });
            };

            console.log(cells);

            cells?.forEach(function (c, idx) {
                c.addEventListener('click', () => {
                    const result = board.makeMove(idx);
                    switch(result)
                    {
                        case ('draw'): {
                            showInfo('Game is a draw');
                            break;
                        }
                        case ('invalidMove'): {
                            showError('Move is invalid');
                            break;
                        }

                        case ('winX'): {
                            showSuccess('X won');
                            app?.querySelector('.ttt-grid')?.classList.add('pointer-events-none');
                            break;
                        }
                        case ('winO'): {
                            showSuccess('O won');
                            app?.querySelector('.ttt-grid')?.classList.add('pointer-events-none');
                            break;
                        }
                    }

                    // Sync UI with Game State
                    const board_state = board.getBoard();
                    board_state.forEach( function (cell_state, cell_idx) {
                        cells[cell_idx].innerText = cell_state !== null ? cell_state : " ";
                    });

                    updateUI();
                });
            });
            restartBtn?.addEventListener('click', () => {
               board.reset();
               // Remove pointer-events-none to re-enable the board if it was disabled
               app?.querySelector('.ttt-grid')?.classList.remove('pointer-events-none');
               updateUI();
               showInfo('Game Restarted');
            });
        }
    }
}


addRoute('/ttt', handleTTT)