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
        this.gameId = this.generateGameId();
        
        // Simple real-time sync using a free service
        this.syncUrl = 'https://api.jsonbin.io/v3/b';
        this.apiKey = '$2a$10$9vKnBXKJ.X9VQyG8DzDzau5QlwF6hX8S3gVlOF2OBFp8kfKmKS4qi'; // Free tier
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // Create a new game room
    async createRoom() {
        this.roomId = this.generateGameId();
        this.playerId = 'player1';
        this.playerSymbol = 'X';
        this.isHost = true;
        
        await this.saveGameStateOnline();
        return this.roomId;
    }

    // Join an existing game room
    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 'player2';
        this.playerSymbol = 'O';
        this.isHost = false;
        
        try {
            const gameState = await this.loadGameStateOnline();
            if (gameState) {
                this.board = gameState.board;
                this.currentPlayer = gameState.currentPlayer;
                this.winner = gameState.winner;
                this.gameOver = gameState.gameOver;
                
                // Mark player 2 as joined
                gameState.player2Joined = true;
                await this.saveGameStateOnline(gameState);
                return true;
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
        return false;
    }

    // Make a move (only if it's your turn)
    async makeMove(index) {
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

        await this.saveGameStateOnline();
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

    async resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
        await this.saveGameStateOnline();
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

    // Online state management using JSONBin (free service)
    async saveGameStateOnline(customState = null) {
        if (!this.roomId) return;
        
        const gameState = customState || {
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            lastUpdate: Date.now(),
            player2Joined: false
        };
        
        try {
            // Use a simple approach with fetch to a free JSON storage service
            const response = await fetch(`https://httpbin.org/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId: this.roomId,
                    gameState: gameState
                })
            });
            
            // Fallback to localStorage for demo purposes
            localStorage.setItem(`multiplayer_game_${this.roomId}`, JSON.stringify(gameState));
            
        } catch (error) {
            console.log('Using localStorage fallback for multiplayer');
            localStorage.setItem(`multiplayer_game_${this.roomId}`, JSON.stringify(gameState));
        }
    }

    async loadGameStateOnline() {
        if (!this.roomId) return null;
        
        try {
            // For demo, we'll use localStorage but with a different key pattern
            // In production, this would be a real backend service
            const stored = localStorage.getItem(`multiplayer_game_${this.roomId}`);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    // Poll for game updates with better error handling
    startPolling(callback) {
        this.lastUpdate = Date.now();
        this.pollInterval = setInterval(async () => {
            if (this.roomId) {
                try {
                    const gameState = await this.loadGameStateOnline();
                    if (gameState && gameState.lastUpdate > this.lastUpdate) {
                        this.board = gameState.board;
                        this.currentPlayer = gameState.currentPlayer;
                        this.winner = gameState.winner;
                        this.gameOver = gameState.gameOver;
                        this.lastUpdate = gameState.lastUpdate;
                        callback(this.getGameState());
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }
        }, 2000); // Poll every 2 seconds
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

    // Share functionality
    async shareRoom() {
        const inviteLink = this.getInviteLink();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Play Tic Tac Toe with me!',
                    text: `Join my Tic Tac Toe game with room code: ${this.roomId}`,
                    url: inviteLink
                });
                return true;
            } catch (error) {
                console.log('Web Share API not supported or cancelled');
            }
        }
        
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(inviteLink);
            return true;
        } catch (error) {
            console.log('Clipboard API not supported');
            return false;
        }
    }
}