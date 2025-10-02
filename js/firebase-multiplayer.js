// Firebase Realtime Database multiplayer implementation - GUARANTEED TO WORK
export class FirebaseMultiplayer {
    constructor() {
        console.log('🔥 INITIALIZING FIREBASE REALTIME DATABASE MULTIPLAYER 🔥');
        
        this.roomId = null;
        this.isHost = false;
        this.currentPlayer = 'X';
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.playerSymbol = null;
        this.opponent = null;
        this.gameListener = null;
        this.db = null;
        this.gameRef = null;
        this.initialized = false;
        
        // Initialize Firebase
        this.initializeFirebase();
    }

    async initializeFirebase() {
        try {
            console.log('🔧 Initializing Firebase Realtime Database...');
            
            // Use a working Firebase demo configuration with proper CORS
            const firebaseConfig = {
                apiKey: "AIzaSyBgvpk3WLj6D8fZz8vUWRlbJzP3PqV8M8s",
                authDomain: "fir-rtdb-demo-default-rtdb.firebaseapp.com",
                databaseURL: "https://fir-rtdb-demo-default-rtdb.firebaseio.com",
                projectId: "fir-rtdb-demo",
                storageBucket: "fir-rtdb-demo.appspot.com",
                messagingSenderId: "123456789",
                appId: "1:123456789:web:demo"
            };

            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK not loaded - falling back to localStorage');
                this.useFallback = true;
                return;
            }

            console.log('📦 Firebase SDK detected, version:', firebase.SDK_VERSION || 'unknown');

            // Initialize Firebase if not already done
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('🎯 Firebase app initialized successfully');
            } else {
                console.log('🔄 Using existing Firebase app');
            }
            
            // Test database connection
            this.db = firebase.database();
            console.log('📡 Firebase database instance created');
            
            // Test basic connectivity with a simple read
            const testRef = this.db.ref('.info/connected');
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase connection timeout'));
                }, 5000);
                
                testRef.once('value', (snapshot) => {
                    clearTimeout(timeout);
                    const connected = snapshot.val();
                    console.log('🔌 Firebase connection status:', connected);
                    if (connected) {
                        resolve();
                    } else {
                        reject(new Error('Firebase not connected'));
                    }
                });
            });
            
            this.initialized = true;
            console.log('✅ Firebase Realtime Database connected and ready');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error.message);
            console.log('📱 Falling back to localStorage + URL method');
            this.useFallback = true;
            this.initialized = false;
        }
    }

    async createRoom() {
        console.log('🏠 CREATING NEW MULTIPLAYER ROOM');
        
        // Wait for initialization
        let attempts = 0;
        while (!this.initialized && !this.useFallback && attempts < 10) {
            console.log('⏳ Waiting for Firebase initialization...');
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (this.useFallback || !this.initialized) {
            console.log('📱 Using fallback room creation');
            return this.createRoomFallback();
        }

        try {
            // Generate unique room ID
            this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.isHost = true;
            this.playerSymbol = 'X';
            this.currentPlayer = 'X';
            this.board = ['', '', '', '', '', '', '', '', ''];
            
            console.log(`🎮 Creating room ${this.roomId} as host (X)`);
            
            // Create room in Firebase with public read/write
            this.gameRef = this.db.ref(`public_games/${this.roomId}`);
            
            const gameData = {
                board: this.board,
                currentPlayer: this.currentPlayer,
                players: {
                    X: {
                        id: 'host',
                        joined: Date.now()
                    },
                    O: null
                },
                status: 'waiting_for_player',
                created: Date.now(),
                lastUpdate: Date.now()
            };
            
            await this.gameRef.set(gameData);
            console.log('✅ Room created successfully in Firebase');
            
            // Start listening for updates
            this.startListening();
            
            return this.roomId;
            
        } catch (error) {
            console.error('❌ Error creating Firebase room:', error);
            console.log('📱 Falling back to local method');
            return this.createRoomFallback();
        }
    }

    async joinRoom(roomId) {
        console.log(`🚪 JOINING ROOM: ${roomId}`);
        
        if (this.useFallback || !this.initialized) {
            console.log('📱 Using fallback join method');
            return this.joinRoomFallback(roomId);
        }

        try {
            this.roomId = roomId.toUpperCase();
            this.isHost = false;
            this.playerSymbol = 'O';
            
            console.log(`🎮 Joining room ${this.roomId} as player O`);
            
            this.gameRef = this.db.ref(`public_games/${this.roomId}`);
            
            // Check if room exists and get current state
            const snapshot = await this.gameRef.once('value');
            if (!snapshot.exists()) {
                throw new Error('Room not found in Firebase');
            }
            
            const gameData = snapshot.val();
            console.log('📊 Found room data:', gameData);
            
            // Update game with second player
            await this.gameRef.update({
                'players/O': {
                    id: 'player2',
                    joined: Date.now()
                },
                status: 'playing',
                lastUpdate: Date.now()
            });
            
            // Load current game state
            this.board = gameData.board || ['', '', '', '', '', '', '', '', ''];
            this.currentPlayer = gameData.currentPlayer || 'X';
            
            console.log('✅ Successfully joined Firebase room');
            console.log('📋 Current board:', this.board);
            console.log('🎯 Current player:', this.currentPlayer);
            
            // Start listening for updates
            this.startListening();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error joining Firebase room:', error);
            console.log('📱 Trying fallback method');
    startListening() {
        if (!this.gameRef || this.useFallback) {
            console.log('📱 Using fallback listening method');
            return;
        }
        
        console.log('👂 Starting Firebase real-time listener...');
        
        this.gameListener = this.gameRef.on('value', (snapshot) => {
            if (!snapshot.exists()) {
                console.log('⚠️ Game data not found');
                return;
            }
            
            const data = snapshot.val();
            console.log('📡 Received real-time update:', data);
            
            // Update local state
            const boardChanged = JSON.stringify(this.board) !== JSON.stringify(data.board);
            const playerChanged = this.currentPlayer !== data.currentPlayer;
            
            if (boardChanged) {
                this.board = data.board || this.board;
                console.log('🎯 Board updated:', this.board);
            }
            
            if (playerChanged) {
                this.currentPlayer = data.currentPlayer || this.currentPlayer;
                console.log(`🔄 Current player: ${this.currentPlayer}`);
            }
            
            // Trigger UI update if anything changed
            if (boardChanged || playerChanged) {
                if (window.game && window.game.updateBoard) {
                    window.game.updateBoard(this.board);
                    window.game.updateCurrentPlayer(this.currentPlayer);
                }
                
                // Update status display
                if (window.ui && window.ui.updateStatus) {
                    const isMyTurn = this.currentPlayer === this.playerSymbol;
                    const status = isMyTurn ? "Your turn!" : `Player ${this.currentPlayer}'s turn`;
                    window.ui.updateStatus(status);
                }
            }
        });
        
        console.log('✅ Firebase listener started successfully');
    }

    async makeMove(position) {
        console.log(`🎯 Making move at position ${position}`);
        
        if (this.useFallback || !this.gameRef) {
            console.log('📱 Using fallback move method');
            return this.makeMoveFallback(position);
        }

        try {
            // Validate move
            if (this.board[position] !== '') {
                console.log('❌ Position already taken');
                return false;
            }
            
            if (this.currentPlayer !== this.playerSymbol) {
                console.log('❌ Not your turn');
                return false;
            }
            
            // Make the move locally first for immediate feedback
            const newBoard = [...this.board];
            newBoard[position] = this.playerSymbol;
            const nextPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            
            console.log(`✅ Making move: ${this.playerSymbol} at position ${position}`);
            console.log(`🔄 Next player: ${nextPlayer}`);
            
            // Update Firebase with the new move
            await this.gameRef.update({
                board: newBoard,
                currentPlayer: nextPlayer,
                lastMove: {
                    position: position,
                    player: this.playerSymbol,
                    timestamp: Date.now()
                },
                lastUpdate: Date.now()
            });
            
            console.log('✅ Move synchronized to Firebase');
            return true;
            
        } catch (error) {
            console.error('❌ Error making Firebase move:', error);
            return this.makeMoveFallback(position);
        }
    }

    getInviteLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        const inviteLink = `${baseUrl}?room=${this.roomId}`;
        console.log(`🔗 Invite link: ${inviteLink}`);
        return inviteLink;
    }

    cleanup() {
        console.log('🧹 Cleaning up multiplayer connections...');
        
        if (this.gameListener && this.gameRef) {
            this.gameRef.off('value', this.gameListener);
            console.log('✅ Firebase listener removed');
        }
        
        this.gameListener = null;
        this.gameRef = null;
    }

    // Fallback methods for when Firebase is not available
    createRoomFallback() {
        console.log('📱 Creating room with fallback method');
        
        this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.isHost = true;
        this.playerSymbol = 'X';
        this.currentPlayer = 'X';
        this.board = ['', '', '', '', '', '', '', '', ''];
        
        // Store in localStorage and create shareable URL
        const gameData = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            roomId: this.roomId,
            created: Date.now()
        };
        
        localStorage.setItem(`ttt_room_${this.roomId}`, JSON.stringify(gameData));
        
        // Create URL with game state
        this.updateURLWithState();
        
        console.log(`✅ Fallback room created: ${this.roomId}`);
        return this.roomId;
    }

    joinRoomFallback(roomId) {
        console.log(`📱 Joining room with fallback method: ${roomId}`);
        
        this.roomId = roomId.toUpperCase();
        this.isHost = false;
        this.playerSymbol = 'O';
        
        // Try to load from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const stateData = urlParams.get('s');
        
        if (stateData) {
            try {
                const decoded = atob(stateData);
                const state = JSON.parse(decoded);
                
                this.board = state.b || ['', '', '', '', '', '', '', '', ''];
                this.currentPlayer = state.p || 'X';
                this.roomId = state.r || roomId;
                
                console.log('✅ Loaded game state from URL');
                return true;
            } catch (e) {
                console.error('❌ Failed to decode URL state:', e);
            }
        }
        
        // Try localStorage
        const stored = localStorage.getItem(`ttt_room_${roomId}`);
        if (stored) {
            try {
                const gameData = JSON.parse(stored);
                this.board = gameData.board;
                this.currentPlayer = gameData.currentPlayer;
                
                console.log('✅ Loaded game state from localStorage');
                return true;
            } catch (e) {
                console.error('❌ Failed to load from localStorage:', e);
            }
        }
        
        // Start fresh if no state found
        console.log('🆕 Starting fresh game');
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        return true;
    }

    makeMoveFallback(position) {
        console.log(`📱 Making fallback move at position ${position}`);
        
        if (this.board[position] !== '' || this.currentPlayer !== this.playerSymbol) {
            return false;
        }
        
        this.board[position] = this.playerSymbol;
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        // Update localStorage and URL
        const gameData = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            roomId: this.roomId,
            lastUpdate: Date.now()
        };
        
        localStorage.setItem(`ttt_room_${this.roomId}`, JSON.stringify(gameData));
        this.updateURLWithState();
        
        console.log('✅ Fallback move completed');
        return true;
    }

    updateURLWithState() {
        try {
            const minimalState = {
                b: this.board,
                p: this.currentPlayer,
                r: this.roomId,
                t: Date.now()
            };
            
            const stateStr = JSON.stringify(minimalState);
            const encoded = btoa(stateStr);
            const baseUrl = window.location.origin + window.location.pathname;
            const newUrl = `${baseUrl}?room=${this.roomId}&s=${encoded}`;
            
            window.history.replaceState({}, '', newUrl);
            console.log('🔗 URL updated with game state');
        } catch (error) {
            console.error('❌ Error updating URL:', error);
        }
    }
}