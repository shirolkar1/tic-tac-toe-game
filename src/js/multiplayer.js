export class MultiplayerGame {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
        this.roomId = null;
        this.playerId = null;
        this.playerSymbol = null;
        this.isHost = false;
        this.socket = null;
        this.gameId = this.generateGameId();
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // Create a new game room
    createRoom() {
        this.roomId = this.generateGameId();
        this.playerId = 'player1';
        this.playerSymbol = 'X';
        this.isHost = true;
        this.saveGameState();
        return this.roomId;
    }

    // Join an existing game room
    joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 'player2';
        this.playerSymbol = 'O';
        this.isHost = false;
        
        const gameState = this.loadGameState(roomId);
        if (gameState) {
            this.board = gameState.board;
            this.currentPlayer = gameState.currentPlayer;
            this.winner = gameState.winner;
            this.gameOver = gameState.gameOver;
            return true;
        }
        return false;
    }

    // Make a move (only if it's your turn)
    makeMove(index) {
        if (this.currentPlayer !== this.playerSymbol) {
            return { success: false, message: "Not your turn!" };
        }

        if (this.board[index] !== '' || this.gameOver) {
            return { success: false, message: "Invalid move!" };
        }

        this.board[index] = this.currentPlayer;
        
        const winner = this.checkWinner();
        if (winner) {
            this.winner = winner;
            this.gameOver = true;
        } else if (this.board.every(cell => cell !== '')) {
            this.gameOver = true;
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }

        this.saveGameState();
        return { success: true, gameState: this.getGameState() };
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
        this.saveGameState();
    }

    getGameState() {
        return {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            roomId: this.roomId,
            playerSymbol: this.playerSymbol,
            isYourTurn: this.currentPlayer === this.playerSymbol
        };
    }

    // Simple localStorage-based state management (for demo)
    // In production, you'd use a real backend/database
    saveGameState() {
        if (!this.roomId) return;
        
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            lastUpdate: Date.now()
        };
        
        localStorage.setItem(`game_${this.roomId}`, JSON.stringify(gameState));
    }

    loadGameState(roomId) {
        const stored = localStorage.getItem(`game_${roomId}`);
        return stored ? JSON.parse(stored) : null;
    }

    // Poll for game updates (simple multiplayer sync)
    startPolling(callback) {
        this.pollInterval = setInterval(() => {
            if (this.roomId) {
                const gameState = this.loadGameState(this.roomId);
                if (gameState && gameState.lastUpdate > (this.lastUpdate || 0)) {
                    this.board = gameState.board;
                    this.currentPlayer = gameState.currentPlayer;
                    this.winner = gameState.winner;
                    this.gameOver = gameState.gameOver;
                    this.lastUpdate = gameState.lastUpdate;
                    callback(this.getGameState());
                }
            }
        }, 1000); // Poll every second
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    getInviteLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?room=${this.roomId}`;
    }
}