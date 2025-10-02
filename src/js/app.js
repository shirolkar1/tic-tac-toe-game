import { Game } from './game.js';
import { UI } from './ui.js';

class TicTacToeApp {
    constructor() {
        this.game = new Game();
        this.ui = new UI();
        this.winningPattern = null;
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        this.ui.addCellClickHandler((index) => this.handleCellClick(index));
        this.ui.addResetHandler(() => this.resetGame());
        this.ui.addNewGameHandler(() => this.newGame());
    }

    handleCellClick(index) {
        if (this.game.makeMove(index)) {
            this.updateUI();
            
            if (this.game.getWinner()) {
                this.handleGameEnd();
            } else if (this.game.isDraw()) {
                this.handleDraw();
            }
        }
    }

    updateUI() {
        this.ui.updateBoard(this.game.getBoard());
        
        if (this.game.isGameOver()) {
            if (this.game.getWinner()) {
                this.ui.updateStatus(`Player ${this.game.getWinner()} wins!`, 'winner');
            } else if (this.game.isDraw()) {
                this.ui.updateStatus("It's a draw!", 'draw');
            }
            this.ui.disableBoard();
        } else {
            this.ui.updateStatus(`Player ${this.game.getCurrentPlayer()}'s turn`);
            this.ui.enableBoard();
        }
    }

    handleGameEnd() {
        const winner = this.game.getWinner();
        this.ui.incrementScore(winner);
        this.ui.updateStatus(`Player ${winner} wins!`, 'winner');
        this.ui.disableBoard();
        
        // Find and highlight winning pattern
        this.highlightWinningPattern();
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    handleDraw() {
        this.ui.updateStatus("It's a draw!", 'draw');
        this.ui.disableBoard();
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    highlightWinningPattern() {
        const board = this.game.getBoard();
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                this.ui.highlightWinningCells(pattern);
                break;
            }
        }
    }

    resetGame() {
        this.game.resetGame();
        this.ui.clearWinningHighlight();
        this.updateUI();
    }

    newGame() {
        this.resetGame();
        this.ui.resetScores();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeApp();
});