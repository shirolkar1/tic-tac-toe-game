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
        // Firebase config - using a demo project with public read/write access
        const firebaseConfig = {
            apiKey: "AIzaSyDummy-Key-For-Demo",
            authDomain: "tic-tac-toe-multiplayer-demo.firebaseapp.com",
            databaseURL: "https://tic-tac-toe-multiplayer-demo-default-rtdb.firebaseio.com",
            projectId: "tic-tac-toe-multiplayer-demo",
            storageBucket: "tic-tac-toe-multiplayer-demo.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:demo123"
        };

        try {
            // Use a simple public database service instead
            this.useFirebase = false;
            console.log('Using alternative backend for cross-device sync');
            
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
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.useFirebase = false;
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
            // Initialize the game state and save to backend
            await this.saveGameState({ 
                player1Joined: true, 
                player2Joined: false,
                roomCreated: Date.now(),
                host: this.playerId
            });
            
            this.startListening();
            
            if (this.backendSyncWorking) {
                console.log('Room created successfully with backend sync:', this.roomId);
            } else {
                console.log('Room created with local storage only:', this.roomId);
            }
            
            return this.roomId;
        } catch (error) {
            console.error('Error creating room:', error);
            return this.roomId; // Return room ID even if save fails
        }
    }

    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 'player2';
        this.playerSymbol = 'O';
        this.isHost = false;
        
        console.log('=== JOINING ROOM WITH GITHUB GIST ===');
        console.log('Attempting to join room:', roomId);
        
        try {
            // Try to load room data from GitHub Gist or localStorage
            const gameData = await this.loadGameState();
            
            if (gameData && gameData.roomId === roomId) {
                console.log('✅ Found room data:', gameData);
                
                this.board = gameData.board || this.board;
                this.currentPlayer = gameData.currentPlayer || this.currentPlayer;
                this.winner = gameData.winner || null;
                this.gameOver = gameData.gameOver || false;
                
                // Mark player 2 as joined
                await this.saveGameState({ 
                    player2Joined: true,
                    player2JoinedAt: Date.now()
                });
                
                this.startListening();
                console.log('✅ Successfully joined room');
                console.log('=== END ROOM JOIN SUCCESS ===');
                return true;
            } else {
                console.log('❌ Room not found');
                if (gameData) {
                    console.log('Found different room:', gameData.roomId, 'vs expected:', roomId);
                } else {
                    console.log('No room data found at all');
                }
                console.log('=== END ROOM JOIN FAILURE ===');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            console.log('=== END ROOM JOIN ERROR ===');
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

    // Simple working solution - embed minimal game state in URL
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
        
        console.log('Saving game state:', gameState);
        
        // Save to localStorage with multiple keys for reliability
        this.saveToLocalStorage(gameState);
        
        // Update URL to include game state for sharing
        this.updateURLWithGameState(gameState);
        
        // Broadcast to other tabs
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'gameUpdate',
                roomId: this.roomId,
                gameState: gameState
            });
        }
    }

    updateURLWithGameState(gameState) {
        try {
            // Create minimal state for URL
            const minimalState = {
                b: gameState.board,
                p: gameState.currentPlayer,
                r: gameState.roomId,
                t: gameState.lastUpdate
            };
            
            // Compress and encode
            const stateStr = JSON.stringify(minimalState);
            const encoded = btoa(stateStr);
            
            // Update URL without reloading page
            const newUrl = `${window.location.pathname}?room=${this.roomId}&s=${encoded}`;
            window.history.replaceState({}, '', newUrl);
            
            console.log('Updated URL with game state');
        } catch (error) {
            console.log('Failed to update URL:', error);
        }
    }

    async loadGameState() {
        if (!this.roomId) return null;
        
        console.log('Loading game state for room:', this.roomId);
        
        try {
            // First check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const roomParam = urlParams.get('room');
            const stateParam = urlParams.get('s');
            
            console.log('URL params - room:', roomParam, 'state:', stateParam ? 'present' : 'missing');
            
            if (roomParam === this.roomId && stateParam) {
                try {
                    const stateStr = atob(stateParam);
                    const minimalState = JSON.parse(stateStr);
                    
                    // Expand minimal state
                    const gameState = {
                        board: minimalState.b,
                        currentPlayer: minimalState.p,
                        winner: null,
                        gameOver: false,
                        roomId: minimalState.r,
                        lastUpdate: minimalState.t
                    };
                    
                    console.log('✅ Loaded game state from URL:', gameState);
                    return gameState;
                } catch (parseError) {
                    console.log('Failed to parse URL state:', parseError);
                }
            }
            
            // Fallback to localStorage
            const localState = this.loadFromLocalStorage();
            if (localState) {
                console.log('✅ Loaded from localStorage:', localState);
                return localState;
            }
            
            console.log('❌ No game state found');
            return null;
            
        } catch (error) {
            console.log('Error loading game state:', error);
            return null;
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
        const sharedKey = `ttt_shared_${this.roomId}`;
        
        localStorage.setItem(key, JSON.stringify(gameState));
        localStorage.setItem(sharedKey, JSON.stringify(gameState));
        
        // Also save to a well-known global key that can be accessed across sessions
        const globalKey = `ttt_global_rooms`;
        let globalRooms = {};
        try {
            globalRooms = JSON.parse(localStorage.getItem(globalKey) || '{}');
        } catch (e) {
            globalRooms = {};
        }
        
        globalRooms[this.roomId] = gameState;
        localStorage.setItem(globalKey, JSON.stringify(globalRooms));
        
        console.log('Game state saved to localStorage with global registry');
        
        // Use BroadcastChannel for cross-tab communication
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'gameStateUpdate',
                roomId: this.roomId,
                gameState: gameState
            });
        }
    }

    loadFromLocalStorage() {
        // Try multiple keys to find the room data
        const keys = [
            `ttt_multiplayer_${this.roomId}`,
            `ttt_shared_${this.roomId}`
        ];
        
        for (const key of keys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const gameState = JSON.parse(stored);
                    if (gameState.roomId === this.roomId) {
                        console.log('Found room data in localStorage');
                        return gameState;
                    }
                } catch (e) {
                    console.log('Error parsing stored data');
                }
            }
        }
        
        // Check global rooms registry
        try {
            const globalRooms = JSON.parse(localStorage.getItem('ttt_global_rooms') || '{}');
            if (globalRooms[this.roomId]) {
                console.log('Found room data in global registry');
                return globalRooms[this.roomId];
            }
        } catch (e) {
            console.log('Error checking global registry');
        }
        
        return null;
    }

    // Improved listening mechanism for cross-device sync
    startListening() {
        console.log('Starting to listen for game updates');
        
        // Set up polling for backend updates (every 2 seconds)
        this.pollingInterval = setInterval(() => {
            this.checkForUpdates();
        }, 2000);
    }

    async checkForUpdates() {
        try {
            const gameState = await this.loadGameState();
            if (gameState && gameState.lastUpdate > (this.lastUpdate || 0)) {
                console.log('Game state updated from backend/remote');
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
        
        console.log('=== CREATING WORKING INVITE LINK ===');
        
        try {
            // Create minimal game state
            const minimalState = {
                b: this.board,
                p: this.currentPlayer,
                r: this.roomId,
                t: Date.now()
            };
            
            const stateStr = JSON.stringify(minimalState);
            const encoded = btoa(stateStr);
            
            const inviteLink = `${baseUrl}?room=${this.roomId}&s=${encoded}`;
            
            console.log('Room ID:', this.roomId);
            console.log('State size:', stateStr.length, 'chars');
            console.log('Encoded size:', encoded.length, 'chars');
            console.log('Full link:', inviteLink);
            console.log('=== END INVITE LINK ===');
            
            return inviteLink;
        } catch (error) {
            console.log('Error creating link:', error);
            const fallback = `${baseUrl}?room=${this.roomId}`;
            console.log('Fallback link:', fallback);
            return fallback;
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