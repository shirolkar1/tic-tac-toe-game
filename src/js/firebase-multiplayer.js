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
        // Firebase config for demo (free tier)
        const firebaseConfig = {
            apiKey: "AIzaSyBH-demo-key-replace-with-real",
            authDomain: "tic-tac-toe-demo.firebaseapp.com",
            projectId: "tic-tac-toe-demo",
            storageBucket: "tic-tac-toe-demo.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:demo"
        };

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.db = firebase.firestore();
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed, falling back to simple sync:', error);
            this.db = null;
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
        
        await this.saveGameState();
        this.startListening();
        return this.roomId;
    }

    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 'player2';
        this.playerSymbol = 'O';
        this.isHost = false;
        
        try {
            const gameData = await this.loadGameState();
            if (gameData) {
                this.board = gameData.board || this.board;
                this.currentPlayer = gameData.currentPlayer || this.currentPlayer;
                this.winner = gameData.winner || null;
                this.gameOver = gameData.gameOver || false;
                
                // Mark player 2 as joined
                await this.saveGameState({ player2Joined: true });
                this.startListening();
                return true;
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
        return false;
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

    // Real-time database operations
    async saveGameState(extraData = {}) {
        if (!this.roomId) return;
        
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            lastUpdate: Date.now(),
            ...extraData
        };
        
        try {
            if (this.db) {
                // Use Firestore for real-time sync
                await this.db.collection('games').doc(this.roomId).set(gameState, { merge: true });
                console.log('Game state saved to Firestore');
            } else {
                // Fallback to JSONBin.io or similar service
                await this.saveToJsonBin(gameState);
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            // Final fallback to localStorage with broadcast channel
            this.saveToLocalStorage(gameState);
        }
    }

    async loadGameState() {
        if (!this.roomId) return null;
        
        try {
            if (this.db) {
                const doc = await this.db.collection('games').doc(this.roomId).get();
                return doc.exists ? doc.data() : null;
            } else {
                return await this.loadFromJsonBin();
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            return this.loadFromLocalStorage();
        }
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

    // Real-time listening
    startListening() {
        if (this.db) {
            // Use Firestore real-time listeners
            this.unsubscribe = this.db.collection('games').doc(this.roomId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        this.updateFromRemote(data);
                    }
                });
        } else {
            // Fallback to polling and BroadcastChannel
            this.startPolling();
            this.setupBroadcastChannel();
        }
    }

    setupBroadcastChannel() {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('tic-tac-toe-game');
            channel.onmessage = (event) => {
                if (event.data.type === 'gameStateUpdate' && 
                    event.data.roomId === this.roomId) {
                    this.updateFromRemote(event.data.gameState);
                }
            };
        }
    }

    updateFromRemote(gameState) {
        if (gameState.lastUpdate > (this.lastUpdate || 0)) {
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
    }

    startPolling() {
        this.pollInterval = setInterval(async () => {
            if (this.roomId) {
                try {
                    const gameState = await this.loadGameState();
                    if (gameState) {
                        this.updateFromRemote(gameState);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }
        }, 3000); // Poll every 3 seconds
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    getInviteLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?room=${this.roomId}`;
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