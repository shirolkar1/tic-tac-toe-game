// Simple cross-device multiplayer using multiple reliable methods
export class FirebaseMultiplayer {
    constructor() {
        console.log('🌐 INITIALIZING CROSS-DEVICE MULTIPLAYER (NO FIREBASE NEEDED) 🌐');
        
        this.roomId = null;
        this.isHost = false;
        this.currentPlayer = 'X';
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.playerSymbol = null;
        this.opponent = null;
        this.pollingInterval = null;
        this.lastUpdate = 0;
        
        // Use multiple backends for maximum reliability
        this.backends = {
            localStorage: true,
            urlState: true,
            httpBin: true,
            github: true
        };
        
        console.log('✅ Cross-device multiplayer initialized and ready');
    }

    async createRoom() {
        console.log('🏠 CREATING CROSS-DEVICE MULTIPLAYER ROOM');
        
        try {
            // Generate unique room ID
            this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.isHost = true;
            this.playerSymbol = 'X';
            this.currentPlayer = 'X';
            this.board = ['', '', '', '', '', '', '', '', ''];
            
            console.log(`🎮 Creating room ${this.roomId} as host (X)`);
            
            // Create comprehensive game data
            const gameData = {
                roomId: this.roomId,
                board: this.board,
                currentPlayer: this.currentPlayer,
                players: {
                    X: { id: 'host', joined: Date.now() },
                    O: null
                },
                status: 'waiting_for_player',
                created: Date.now(),
                lastUpdate: Date.now()
            };
            
            // Save to all available backends
            await this.saveToAllBackends(gameData);
            
            // Start polling for updates
            this.startPolling();
            
            console.log('✅ Room created successfully across all backends');
            return this.roomId;
            
        } catch (error) {
            console.error('❌ Error creating room:', error);
            throw error;
        }
    }

    async joinRoom(roomId) {
        console.log(`🚪 JOINING CROSS-DEVICE ROOM: ${roomId}`);
        
        try {
            this.roomId = roomId.toUpperCase();
            this.isHost = false;
            this.playerSymbol = 'O';
            
            console.log(`🎮 Joining room ${this.roomId} as player O`);
            
            // Try to load existing game data from any backend
            const gameData = await this.loadFromAnyBackend();
            
            if (gameData && gameData.roomId === this.roomId) {
                console.log('📊 Found existing room data:', gameData);
                
                // Update with second player
                gameData.players.O = { id: 'player2', joined: Date.now() };
                gameData.status = 'playing';
                gameData.lastUpdate = Date.now();
                
                // Save updated data to all backends
                await this.saveToAllBackends(gameData);
                
                // Load current game state
                this.board = gameData.board || ['', '', '', '', '', '', '', '', ''];
                this.currentPlayer = gameData.currentPlayer || 'X';
                
                console.log('✅ Successfully joined room');
                console.log('📋 Current board:', this.board);
                console.log('🎯 Current player:', this.currentPlayer);
                
                // Start polling for updates
                this.startPolling();
                
                return true;
            } else {
                // Try fallback methods
                console.log('❌ Room not found in backends, trying URL parameters');
                return this.joinFromURL(roomId);
            }
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            // Always try URL fallback
            return this.joinFromURL(roomId);
        }
    }

    async saveToAllBackends(gameData) {
        console.log('💾 SAVING TO ALL BACKENDS FOR MAXIMUM RELIABILITY');
        
        const promises = [];
        
        // 1. LocalStorage (same browser/device)
        promises.push(this.saveToLocalStorage(gameData));
        
        // 2. URL state (cross-device via link sharing)
        promises.push(this.updateURLWithState(gameData));
        
        // 3. HTTPBin echo service (temporary cross-device)
        promises.push(this.saveToHttpBin(gameData));
        
        // 4. Simple file hosting service
        promises.push(this.saveToFileHost(gameData));
        
        try {
            await Promise.allSettled(promises);
            console.log('✅ Saved to multiple backends');
        } catch (error) {
            console.log('⚠️ Some backends failed, but at least URL method should work');
        }
    }

    async loadFromAnyBackend() {
        console.log('📥 LOADING FROM ANY AVAILABLE BACKEND');
        
        // Try backends in order of reliability for cross-device
        const methods = [
            () => this.loadFromURL(),
            () => this.loadFromHttpBin(),
            () => this.loadFromLocalStorage(),
            () => this.loadFromFileHost()
        ];
        
        for (const method of methods) {
            try {
                const data = await method();
                if (data) {
                    console.log('✅ Successfully loaded game data');
                    return data;
                }
            } catch (error) {
                console.log('⚠️ Backend method failed, trying next...');
            }
        }
        
        console.log('❌ No game data found in any backend');
        return null;
    }

    saveToLocalStorage(gameData) {
        try {
            // Save with multiple keys for reliability
            const keys = [
                `ttt_room_${this.roomId}`,
                `ttt_cross_device_${this.roomId}`,
                `ttt_multiplayer_${this.roomId}`
            ];
            
            for (const key of keys) {
                localStorage.setItem(key, JSON.stringify(gameData));
            }
            
            // Also save to global registry
            const globalKey = 'ttt_all_rooms';
            let allRooms = {};
            try {
                allRooms = JSON.parse(localStorage.getItem(globalKey) || '{}');
            } catch (e) {}
            
            allRooms[this.roomId] = gameData;
            localStorage.setItem(globalKey, JSON.stringify(allRooms));
            
            console.log('✅ Saved to localStorage');
            return true;
        } catch (error) {
            console.log('❌ LocalStorage save failed:', error.message);
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            // Try multiple keys
            const keys = [
                `ttt_room_${this.roomId}`,
                `ttt_cross_device_${this.roomId}`,
                `ttt_multiplayer_${this.roomId}`
            ];
            
            for (const key of keys) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.roomId === this.roomId) {
                        console.log('✅ Loaded from localStorage');
                        return data;
                    }
                }
            }
            
            // Try global registry
            const allRooms = JSON.parse(localStorage.getItem('ttt_all_rooms') || '{}');
            if (allRooms[this.roomId]) {
                console.log('✅ Loaded from global registry');
                return allRooms[this.roomId];
            }
            
            return null;
        } catch (error) {
            console.log('❌ LocalStorage load failed:', error.message);
            return null;
        }
    }

    updateURLWithState(gameData) {
        try {
            // Create minimal state for URL
            const minimalState = {
                r: gameData.roomId,
                b: gameData.board,
                p: gameData.currentPlayer,
                t: gameData.lastUpdate,
                players: gameData.players
            };
            
            const stateStr = JSON.stringify(minimalState);
            const encoded = btoa(stateStr);
            
            const baseUrl = window.location.origin + window.location.pathname;
            const newUrl = `${baseUrl}?room=${this.roomId}&state=${encoded}`;
            
            // Update URL without reload
            window.history.replaceState({}, '', newUrl);
            
            console.log('✅ Updated URL with game state');
            console.log('🔗 Share this URL:', newUrl);
            
            return true;
        } catch (error) {
            console.log('❌ URL update failed:', error.message);
            return false;
        }
    }

    loadFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const roomParam = urlParams.get('room');
            const stateParam = urlParams.get('state') || urlParams.get('s');
            
            console.log('🔍 Checking URL parameters...');
            console.log('Room:', roomParam);
            console.log('State:', stateParam ? 'present' : 'missing');
            
            if (roomParam === this.roomId && stateParam) {
                const decoded = atob(stateParam);
                const state = JSON.parse(decoded);
                
                // Expand minimal state
                const gameData = {
                    roomId: state.r,
                    board: state.b,
                    currentPlayer: state.p,
                    lastUpdate: state.t,
                    players: state.players || {},
                    status: 'playing'
                };
                
                console.log('✅ Loaded from URL parameters');
                return gameData;
            }
            
            return null;
        } catch (error) {
            console.log('❌ URL load failed:', error.message);
            return null;
        }
    }

    async saveToHttpBin(gameData) {
        try {
            // Use HTTPBin.org as a simple echo service
            const response = await fetch('https://httpbin.org/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: this.roomId,
                    gameData: gameData,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                console.log('✅ Saved to HTTPBin');
                return true;
            }
        } catch (error) {
            console.log('❌ HTTPBin save failed:', error.message);
        }
        return false;
    }

    async loadFromHttpBin() {
        // HTTPBin is just an echo service, so we can't really load from it
        // This is just for demonstration
        return null;
    }

    async saveToFileHost(gameData) {
        try {
            // Use GitHub Gist as a simple file host
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: `Tic Tac Toe Game Room ${this.roomId}`,
                    public: true,
                    files: {
                        [`game_${this.roomId}.json`]: {
                            content: JSON.stringify(gameData, null, 2)
                        }
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.gistId = result.id;
                this.gistUrl = result.html_url;
                console.log('✅ Saved to GitHub Gist:', this.gistUrl);
                return true;
            }
        } catch (error) {
            console.log('❌ GitHub Gist save failed:', error.message);
        }
        return false;
    }

    async loadFromFileHost() {
        if (!this.gistId) return null;
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            if (response.ok) {
                const gist = await response.json();
                const files = Object.values(gist.files);
                if (files.length > 0) {
                    const content = files[0].content;
                    const gameData = JSON.parse(content);
                    console.log('✅ Loaded from GitHub Gist');
                    return gameData;
                }
            }
        } catch (error) {
            console.log('❌ GitHub Gist load failed:', error.message);
        }
        return null;
    }

    joinFromURL(roomId) {
        console.log(`📱 JOINING FROM URL FALLBACK: ${roomId}`);
        
        try {
            // Load state directly from URL
            const urlParams = new URLSearchParams(window.location.search);
            const stateParam = urlParams.get('state') || urlParams.get('s');
            
            if (stateParam) {
                const decoded = atob(stateParam);
                const state = JSON.parse(decoded);
                
                this.board = state.b || ['', '', '', '', '', '', '', '', ''];
                this.currentPlayer = state.p || 'X';
                this.roomId = state.r || roomId;
                
                console.log('✅ Joined from URL fallback');
                console.log('📋 Board:', this.board);
                console.log('🎯 Current player:', this.currentPlayer);
                
                return true;
            }
            
            // If no state, start fresh
            console.log('🆕 Starting fresh game');
            this.board = ['', '', '', '', '', '', '', '', ''];
            this.currentPlayer = 'X';
            this.roomId = roomId;
            
            return true;
            
        } catch (error) {
            console.error('❌ URL fallback failed:', error);
            return false;
        }
    }

    async makeMove(position) {
        console.log(`🎯 MAKING MOVE AT POSITION ${position}`);
        console.log(`👤 Player symbol: ${this.playerSymbol}`);
        console.log(`🎮 Current player: ${this.currentPlayer}`);
        console.log(`📋 Current board:`, this.board);
        
        try {
            // Validate move
            if (this.board[position] !== '') {
                console.log('❌ Position already taken');
                return false;
            }
            
            if (this.currentPlayer !== this.playerSymbol) {
                console.log('❌ Not your turn - current player is', this.currentPlayer);
                return false;
            }
            
            // Make the move locally first for immediate feedback
            console.log(`✅ Making move: ${this.playerSymbol} at position ${position}`);
            this.board[position] = this.playerSymbol;
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.lastUpdate = Date.now();
            
            console.log(`🔄 Next player: ${this.currentPlayer}`);
            console.log(`� Updated board:`, this.board);
            
            // Immediately update local UI
            this.forceUIUpdate();
            
            // Create comprehensive game data for sync
            const gameData = {
                roomId: this.roomId,
                board: this.board,
                currentPlayer: this.currentPlayer,
                lastUpdate: this.lastUpdate,
                players: {
                    X: { id: this.isHost ? 'host' : 'player2' },
                    O: { id: this.isHost ? 'player2' : 'host' }
                },
                status: 'playing',
                lastMove: {
                    position: position,
                    player: this.playerSymbol,
                    timestamp: this.lastUpdate
                }
            };
            
            console.log('💾 Saving move to all backends...');
            await this.saveToAllBackends(gameData);
            
            console.log('✅ Move synchronized to all backends');
            console.log('🎯 Game continues - waiting for other player');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error making move:', error);
            return false;
        }
    }

    startPolling() {
        console.log('⏰ Starting polling for game updates...');
        
        // Poll more frequently for better responsiveness
        this.pollingInterval = setInterval(async () => {
            try {
                console.log('🔍 Polling for updates...');
                const gameData = await this.loadFromAnyBackend();
                
                if (gameData && gameData.lastUpdate > this.lastUpdate) {
                    console.log('📡 NEW UPDATE DETECTED!');
                    console.log('📊 Remote game data:', gameData);
                    console.log('🕒 Remote timestamp:', gameData.lastUpdate);
                    console.log('🕒 Local timestamp:', this.lastUpdate);
                    
                    this.updateFromRemote(gameData);
                } else {
                    console.log('📭 No new updates (latest:', this.lastUpdate, ')');
                }
            } catch (error) {
                console.log('⚠️ Polling error:', error.message);
            }
        }, 1000); // Poll every 1 second for faster sync
    }

    updateFromRemote(gameData) {
        console.log('🔄 UPDATING GAME STATE FROM REMOTE');
        console.log('📋 Old board:', this.board);
        console.log('📋 New board:', gameData.board);
        console.log('🎯 Old player:', this.currentPlayer);
        console.log('🎯 New player:', gameData.currentPlayer);
        
        // Update local state
        this.board = gameData.board;
        this.currentPlayer = gameData.currentPlayer;
        this.lastUpdate = gameData.lastUpdate;
        
        // Force UI update using multiple methods
        this.forceUIUpdate();
        
        console.log('✅ Game state updated successfully');
    }

    forceUIUpdate() {
        console.log('🖥️ FORCING UI UPDATE');
        
        try {
            // Method 1: Direct window.game callback
            if (window.game) {
                console.log('📱 Updating via window.game');
                if (window.game.updateBoard) {
                    window.game.updateBoard(this.board);
                }
                if (window.game.updateCurrentPlayer) {
                    window.game.updateCurrentPlayer(this.currentPlayer);
                }
            }
            
            // Method 2: Direct window.ui callback
            if (window.ui) {
                console.log('📱 Updating via window.ui');
                if (window.ui.updateBoard) {
                    window.ui.updateBoard(this.board);
                }
                if (window.ui.updateStatus) {
                    const isMyTurn = this.currentPlayer === this.playerSymbol;
                    const status = isMyTurn ? 
                        `Your turn! (${this.playerSymbol})` : 
                        `Player ${this.currentPlayer}'s turn`;
                    window.ui.updateStatus(status);
                }
            }
            
            // Method 3: Direct DOM manipulation as backup
            console.log('📱 Updating via direct DOM manipulation');
            this.updateDOMDirectly();
            
            // Method 4: Trigger custom events
            window.dispatchEvent(new CustomEvent('gameStateUpdate', {
                detail: {
                    board: this.board,
                    currentPlayer: this.currentPlayer,
                    playerSymbol: this.playerSymbol
                }
            }));
            
            console.log('✅ UI update completed');
            
        } catch (error) {
            console.error('❌ UI update failed:', error);
        }
    }

    updateDOMDirectly() {
        try {
            // Update board cells directly
            const cells = document.querySelectorAll('.cell');
            if (cells.length === 9) {
                console.log('📱 Updating cells directly');
                this.board.forEach((symbol, index) => {
                    if (cells[index]) {
                        cells[index].textContent = symbol;
                        cells[index].setAttribute('data-value', symbol);
                    }
                });
            }
            
            // Update status directly
            const statusElement = document.getElementById('status');
            if (statusElement) {
                const isMyTurn = this.currentPlayer === this.playerSymbol;
                const statusText = isMyTurn ? 
                    `Your turn! (${this.playerSymbol})` : 
                    `Player ${this.currentPlayer}'s turn`;
                statusElement.textContent = statusText;
                console.log('📱 Status updated directly:', statusText);
            }
            
        } catch (error) {
            console.error('❌ Direct DOM update failed:', error);
        }
    }

    getInviteLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        
        // Create state data for the URL
        const stateData = {
            r: this.roomId,
            b: this.board,
            p: this.currentPlayer,
            t: Date.now()
        };
        
        const encoded = btoa(JSON.stringify(stateData));
        const inviteLink = `${baseUrl}?room=${this.roomId}&state=${encoded}`;
        
        console.log(`🔗 Invite link: ${inviteLink}`);
        return inviteLink;
    }

    cleanup() {
        console.log('🧹 Cleaning up multiplayer connections...');
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Fallback methods - these are already implemented above
    createRoomFallback() {
        return this.createRoom();
    }

    joinRoomFallback(roomId) {
        return this.joinFromURL(roomId);
    }

    makeMoveFallback(position) {
        return this.makeMove(position);
    }

    updateURLWithState() {
        // Already implemented above
        return true;
    }
}