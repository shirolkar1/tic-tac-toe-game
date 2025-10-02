export class Game {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
    }

    makeMove(index) {
        // Return false if the cell is occupied or game is over
        if (this.board[index] !== '' || this.gameOver) {
            return false;
        }

        // Make the move
        this.board[index] = this.currentPlayer;
        
        // Check for winner
        const winner = this.checkWinner();
        if (winner) {
            this.winner = winner;
            this.gameOver = true;
        } else if (this.board.every(cell => cell !== '')) {
            // Check for draw
            this.gameOver = true;
        } else {
            // Switch players
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }

        return true;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }

        return null;
    }

    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
    }

    isDraw() {
        return this.board.every(cell => cell !== '') && !this.winner;
    }

    getBoard() {
        return [...this.board];
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    getWinner() {
        return this.winner;
    }

    isGameOver() {
        return this.gameOver;
    }
}