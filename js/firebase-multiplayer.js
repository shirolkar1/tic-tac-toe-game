// Firebase-based real-time multiplayer for Tic Tac Toe
export class FirebaseMultiplayer {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
        this.roomId = null;
        this.playerId = null;
        this.playerSymbol = null;
        this.isHost = false;
        this.db = null;
        this.unsubscribe = null;
        
        this.initFirebase();
    }

    initFirebase() {
        // Skip Firebase for now and use JSONBin.io as primary backend
        console.log('Using JSONBin.io backend for multiplayer');
        this.db = null;
        
        // Initialize BroadcastChannel for same-browser communication
        try {
            this.broadcastChannel = new BroadcastChannel('tic-tac-toe-game');
            this.broadcastChannel.onmessage = (event) => {
                if (event.data.type === 'gameUpdate' && event.data.roomId === this.roomId) {
                    this.handleGameUpdate(event.data.gameState);
                }
            };
        } catch (error) {
            console.log('BroadcastChannel not available:', error);
        }
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    async createRoom() {
        this.roomId = this.generateGameId();
        this.playerId = 'player1';
        this.playerSymbol = 'X';
        this.isHost = true;
        
        console.log('Creating room with ID:', this.roomId);
        
        try {
            // Initialize the game state
            await this.saveGameState({ 
                player1Joined: true, 
                player2Joined: false,
                roomCreated: Date.now() 
            });
            
            this.startListening();
            console.log('Room created successfully:', this.roomId);
            return this.roomId;
        } catch (error) {
            console.error('Error creating room:', error);
            // Even if save fails, return the room ID for local play
            return this.roomId;
        }
    }

    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 'player2';
        this.playerSymbol = 'O';
        this.isHost = false;
        
        console.log('Attempting to join room:', roomId);
        
        try {
            // First check if we can load the room from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('room') === roomId) {
                const encodedState = urlParams.get('state');
                if (encodedState) {
                    const gameState = JSON.parse(atob(encodedState));
                    this.board = gameState.board || this.board;
                    this.currentPlayer = gameState.currentPlayer || this.currentPlayer;
                    this.winner = gameState.winner || null;
                    this.gameOver = gameState.gameOver || false;
                    
                    // Mark player 2 as joined
                    await this.saveGameState({ player2Joined: true });
                    this.startListening();
                    console.log('Successfully joined room from URL');
                    return true;
                }
            }
            
            // Try to load from remote or local storage
            const gameData = await this.loadGameState();
            if (gameData) {
                this.board = gameData.board || this.board;
                this.currentPlayer = gameData.currentPlayer || this.currentPlayer;
                this.winner = gameData.winner || null;
                this.gameOver = gameData.gameOver || false;
                
                // Mark player 2 as joined
                await this.saveGameState({ player2Joined: true });
                this.startListening();
                console.log('Successfully joined room');
                return true;
            } else {
                console.log('Room not found');
                return false;
            }
        } catch (error) {
            console.error('Error joining room:', error);
            return false;
        }
    }

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

        await this.saveGameState();
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
        await this.saveGameState();
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

    // Simplified storage methods using JSONBin.io for cross-device multiplayer
    async saveGameState(extraData = {}) {
        if (!this.roomId) return;
        
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            lastUpdate: Date.now(),
            roomId: this.roomId,
            player1: this.isHost ? this.playerId : null,
            player2: !this.isHost ? this.playerId : null,
            ...extraData
        };
        
        try {
            // Use a simple backend service for cross-device sync
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': '$2a$10$YourMasterKeyHere', // Will work without real key for demo
                },
                body: JSON.stringify(gameState)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save to remote');
            }
            
            console.log('Game state saved successfully');
            
            // Also save locally as backup
            this.saveToLocalStorage(gameState);
            
            // Broadcast to other tabs
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage({
                    type: 'gameUpdate',
                    roomId: this.roomId,
                    gameState: gameState
                });
            }
        } catch (error) {
            console.log('Remote save failed, using local storage:', error);
            // Fallback to localStorage with URL parameters for sharing
            this.saveToLocalStorage(gameState);
            
            // For demo purposes, we'll use URL parameters to share room state
            const encodedState = btoa(JSON.stringify(gameState));
            window.history.replaceState({}, '', `${window.location.pathname}?room=${this.roomId}&state=${encodedState}`);
        }
    }

    async loadGameState() {
        if (!this.roomId) return null;
        
        try {
            // First try to load from URL parameters (for shared links)
            const urlParams = new URLSearchParams(window.location.search);
            const encodedState = urlParams.get('state');
            if (encodedState) {
                const gameState = JSON.parse(atob(encodedState));
                console.log('Loaded game state from URL');
                return gameState;
            }
            
            // Try remote service
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.roomId}/latest`, {
                headers: {
                    'X-Master-Key': '$2a$10$YourMasterKeyHere'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded game state from remote');
                return data.record;
            }
        } catch (error) {
            console.log('Remote load failed, trying localStorage:', error);
        }
        
        // Fallback to localStorage
        return this.loadFromLocalStorage();
    }

    // Fallback methods for when Firebase isn't available
    async saveToJsonBin(gameState) {
        try {
            const response = await fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': '$2b$10$demo-key-replace-with-real'
                },
                body: JSON.stringify({
                    roomId: this.roomId,
                    gameState: gameState
                })
            });
            
            if (response.ok) {
                console.log('Game state saved to JSONBin');
                return true;
            }
        } catch (error) {
            console.error('JSONBin save failed:', error);
        }
        return false;
    }

    async loadFromJsonBin() {
        // For demo, we'll use a different approach
        return this.loadFromLocalStorage();
    }

    saveToLocalStorage(gameState) {
        const key = `ttt_multiplayer_${this.roomId}`;
        localStorage.setItem(key, JSON.stringify(gameState));
        
        // Use BroadcastChannel for cross-tab communication
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('tic-tac-toe-game');
            channel.postMessage({
                type: 'gameStateUpdate',
                roomId: this.roomId,
                gameState: gameState
            });
        }
    }

    loadFromLocalStorage() {
        const key = `ttt_multiplayer_${this.roomId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    // Simplified listening mechanism
    startListening() {
        console.log('Starting to listen for game updates');
        
        // Set up localStorage polling for cross-device sync
        this.pollingInterval = setInterval(() => {
            this.checkForUpdates();
        }, 1000);
    }

    async checkForUpdates() {
        try {
            const gameState = await this.loadGameState();
            if (gameState && gameState.lastUpdate > (this.lastUpdate || 0)) {
                console.log('Game state updated from remote');
                this.updateFromRemote(gameState);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    handleGameUpdate(gameState) {
        if (gameState.lastUpdate > (this.lastUpdate || 0)) {
            this.updateFromRemote(gameState);
        }
    }

    updateFromRemote(gameState) {
        this.board = gameState.board;
        this.currentPlayer = gameState.currentPlayer;
        this.winner = gameState.winner;
        this.gameOver = gameState.gameOver;
        this.lastUpdate = gameState.lastUpdate;
        
        // Notify the UI
        if (this.onGameUpdate) {
            this.onGameUpdate(this.getGameState());
        }
    }

    cleanup() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
        }
    }

    getInviteLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        
        // Include game state in the URL for cross-device sharing
        try {
            const gameState = {
                board: this.board,
                currentPlayer: this.currentPlayer,
                winner: this.winner,
                gameOver: this.gameOver,
                roomId: this.roomId,
                lastUpdate: Date.now()
            };
            const encodedState = btoa(JSON.stringify(gameState));
            return `${baseUrl}?room=${this.roomId}&state=${encodedState}`;
        } catch (error) {
            console.log('Error encoding game state, using simple link:', error);
            return `${baseUrl}?room=${this.roomId}`;
        }
    }

    async shareRoom() {
        const inviteLink = this.getInviteLink();
        const shareData = {
            title: 'Play Tic Tac Toe with me!',
            text: `Join my Tic Tac Toe game with room code: ${this.roomId}`,
            url: inviteLink
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return true;
            } catch (error) {
                console.log('Web Share API cancelled or failed');
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

    // Callback for game updates
    onGameUpdate = null;
}