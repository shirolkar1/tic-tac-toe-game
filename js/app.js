import { Game } from './game.js';
import { FirebaseMultiplayer } from './firebase-multiplayer.js';
import { UI } from './ui.js';

class TicTacToeApp {
    constructor() {
        this.game = new Game();
        this.multiplayerGame = null;
        this.ui = new UI();
        this.winningPattern = null;
        this.isMultiplayerMode = false;
        
        this.initializeGame();
        this.checkForRoomInvite();
    }

    initializeGame() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        this.ui.addCellClickHandler((index) => this.handleCellClick(index));
        this.ui.addResetHandler(() => this.resetGame());
        this.ui.addNewGameHandler(() => this.newGame());
        
        // Multiplayer event listeners
        this.ui.onCreateRoom = () => this.createMultiplayerRoom();
        this.ui.onJoinRoom = (roomCode) => this.joinMultiplayerRoom(roomCode);
        this.ui.shareRoom = () => this.shareMultiplayerRoom();
    }

    checkForRoomInvite() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        const gameData = urlParams.get('s');
        
        console.log('🔍 CHECKING FOR ROOM INVITE IN URL');
        console.log('URL:', window.location.href);
        console.log('Room code:', roomCode);
        console.log('Game data:', gameData ? 'present' : 'not present');
        
        if (roomCode) {
            console.log('✅ Found room invite in URL:', roomCode);
            
            // Show immediate feedback to user
            this.ui.updateStatus('Found room invite! Joining automatically...', '');
            
            // Auto-join room from invite link - do it immediately
            console.log('🚪 Auto-joining room...');
            this.joinMultiplayerRoom(roomCode);
        } else {
            console.log('❌ No room code found in URL');
        }
    }

    async createMultiplayerRoom() {
        console.log('createMultiplayerRoom called!');
        
        try {
            console.log('Creating FirebaseMultiplayer instance...');
            this.multiplayerGame = new FirebaseMultiplayer();
            console.log('FirebaseMultiplayer created:', this.multiplayerGame);
            
            // Set up real-time listener
            this.multiplayerGame.onGameUpdate = (gameState) => {
                console.log('Game update received:', gameState);
                this.updateMultiplayerUI(gameState);
            };
            
            console.log('Calling createRoom...');
            const roomCode = await this.multiplayerGame.createRoom();
            console.log('Room code generated:', roomCode);
            
            if (!roomCode) {
                throw new Error('Failed to generate room code');
            }
            
            const inviteLink = this.multiplayerGame.getInviteLink();
            console.log('Invite link generated:', inviteLink);
            
            this.isMultiplayerMode = true;
            this.ui.showRoomInfo(roomCode, 'X', inviteLink);
            this.ui.updatePlayerStatus('Waiting for opponent...');
            
            this.ui.updateStatus('Room created! Share the invite link with a friend.');
            console.log('Room creation completed successfully');
        } catch (error) {
            console.error('Error creating multiplayer room:', error);
            this.ui.updateStatus(`Error creating room: ${error.message}`, 'error');
        }
    }

    async shareMultiplayerRoom() {
        if (this.multiplayerGame) {
            const success = await this.multiplayerGame.shareRoom();
            if (success) {
                this.ui.updateStatus('Invite link shared!', 'winner');
                setTimeout(() => {
                    this.ui.updateStatus('Waiting for opponent...');
                }, 2000);
            } else {
                this.ui.updateStatus('Could not share. Try copying the link instead.', 'error');
            }
        }
    }

    async joinMultiplayerRoom(roomCode) {
        console.log('🚪 === APP: JOINING MULTIPLAYER ROOM ===');
        console.log('🎯 Room code:', roomCode);
        console.log('🌐 Current URL:', window.location.href);
        
        try {
            // Show loading state
            this.ui.updateStatus('Connecting to multiplayer game...', '');
            
            console.log('🔥 Creating Firebase multiplayer instance...');
            this.multiplayerGame = new FirebaseMultiplayer();
            
            // Wait a moment for Firebase to initialize
            console.log('⏳ Waiting for Firebase initialization...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Set up real-time listener before joining
            this.multiplayerGame.onGameUpdate = (gameState) => {
                console.log('📡 Game update received in app:', gameState);
                this.updateMultiplayerUI(gameState);
            };
            
            console.log('🎮 Attempting to join room...');
            this.ui.updateStatus('Joining room...', '');
            
            const success = await this.multiplayerGame.joinRoom(roomCode);
            
            console.log('✅ Join room result:', success);
            
            if (success) {
                console.log('🎉 Successfully joined room!');
                this.isMultiplayerMode = true;
                
                // Get current game state
                const gameState = {
                    board: this.multiplayerGame.board,
                    currentPlayer: this.multiplayerGame.currentPlayer,
                    playerSymbol: this.multiplayerGame.playerSymbol,
                    roomId: this.multiplayerGame.roomId
                };
                
                console.log('📊 Current game state after join:', gameState);
                
                // Update UI with room info
                const inviteLink = this.multiplayerGame.getInviteLink();
                this.ui.showRoomInfo(roomCode, gameState.playerSymbol, inviteLink);
                
                // Update game board
                this.updateMultiplayerUI(gameState);
                
                // Show success message
                const isMyTurn = gameState.currentPlayer === gameState.playerSymbol;
                const statusMessage = isMyTurn ? 
                    `Joined as ${gameState.playerSymbol}! Your turn.` : 
                    `Joined as ${gameState.playerSymbol}! Waiting for ${gameState.currentPlayer}.`;
                
                this.ui.updateStatus(statusMessage, 'success');
                console.log('🎯 Status:', statusMessage);
                
            } else {
                console.log('❌ Failed to join room');
                this.ui.updateStatus('Room not found! Please check the room code.', 'error');
                
                // Try to show debug info
                console.log('🔍 Debug: Checking URL parameters again...');
                const urlParams = new URLSearchParams(window.location.search);
                console.log('🔍 All URL params:', Object.fromEntries(urlParams.entries()));
            }
            
        } catch (error) {
            console.error('❌ Error joining room in app:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            this.ui.updateStatus('Error joining room. Please try again.', 'error');
            
            // Show fallback options
            console.log('🔄 Trying fallback join methods...');
            if (this.multiplayerGame) {
                try {
                    const fallbackSuccess = await this.multiplayerGame.joinRoomFallback(roomCode);
                    if (fallbackSuccess) {
                        console.log('✅ Fallback join succeeded');
                        this.isMultiplayerMode = true;
                        this.ui.updateStatus('Joined using fallback method', 'success');
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                }
            }
        }
        
        console.log('🏁 === END APP: JOINING MULTIPLAYER ROOM ===');
    }

    handleCellClick(index) {
        if (this.isMultiplayerMode) {
            this.handleMultiplayerMove(index);
        } else {
            this.handleSinglePlayerMove(index);
        }
    }

    handleSinglePlayerMove(index) {
        if (this.game.makeMove(index)) {
            this.updateUI();
            
            if (this.game.getWinner()) {
                this.handleGameEnd();
            } else if (this.game.isDraw()) {
                this.handleDraw();
            }
        }
    }

    async handleMultiplayerMove(index) {
        try {
            const result = await this.multiplayerGame.makeMove(index);
            
            if (result && result.success) {
                // The UI will be updated via the real-time listener
                // but we can also update immediately for better UX
                this.updateMultiplayerUI(result.gameState);
                
                if (result.gameState.winner) {
                    this.handleMultiplayerGameEnd(result.gameState);
                } else if (result.gameState.gameOver) {
                    this.handleMultiplayerDraw();
                }
            } else {
                const errorMessage = result ? result.message : 'Error making move';
                this.ui.updateStatus(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error making multiplayer move:', error);
            this.ui.updateStatus('Error making move. Please try again.', 'error');
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

    updateMultiplayerUI(gameState) {
        this.ui.updateBoard(gameState.board);
        
        if (gameState.gameOver) {
            if (gameState.winner) {
                const isWinner = gameState.winner === this.multiplayerGame.playerSymbol;
                this.ui.updateStatus(
                    isWinner ? 'You won! 🎉' : `Player ${gameState.winner} wins!`,
                    isWinner ? 'winner' : 'error'
                );
            } else {
                this.ui.updateStatus("It's a draw!", 'draw');
            }
            this.ui.disableBoard();
        } else {
            const statusMessage = gameState.isYourTurn 
                ? `Your turn (${this.multiplayerGame.playerSymbol})`
                : `Opponent's turn (${gameState.currentPlayer})`;
            this.ui.updateStatus(statusMessage);
            
            if (gameState.isYourTurn) {
                this.ui.enableBoard();
            } else {
                this.ui.disableBoard();
            }
        }
    }

    handleGameEnd() {
        const winner = this.game.getWinner();
        this.ui.incrementScore(winner);
        this.ui.updateStatus(`Player ${winner} wins!`, 'winner');
        this.ui.disableBoard();
        
        this.highlightWinningPattern();
        
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    handleMultiplayerGameEnd(gameState) {
        const winner = gameState.winner;
        const isWinner = winner === this.multiplayerGame.playerSymbol;
        
        this.ui.incrementScore(winner);
        this.ui.updateStatus(
            isWinner ? 'You won! 🎉' : `Player ${winner} wins!`,
            isWinner ? 'winner' : 'error'
        );
        this.ui.disableBoard();
        
        this.highlightWinningPattern();
        
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    handleDraw() {
        this.ui.updateStatus("It's a draw!", 'draw');
        this.ui.disableBoard();
        
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    handleMultiplayerDraw() {
        this.ui.updateStatus("It's a draw!", 'draw');
        this.ui.disableBoard();
        
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    highlightWinningPattern() {
        const board = this.isMultiplayerMode 
            ? this.multiplayerGame.getGameState().board 
            : this.game.getBoard();
            
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

    async resetGame() {
        if (this.isMultiplayerMode) {
            await this.multiplayerGame.resetGame();
            const gameState = this.multiplayerGame.getGameState();
            this.updateMultiplayerUI(gameState);
        } else {
            this.game.resetGame();
            this.updateUI();
        }
        
        this.ui.clearWinningHighlight();
    }

    newGame() {
        // Clean up multiplayer connection if active
        if (this.multiplayerGame) {
            this.multiplayerGame.cleanup();
        }
        
        // Reset to single player mode
        this.isMultiplayerMode = false;
        this.multiplayerGame = null;
        this.game.resetGame();
        this.ui.resetScores();
        this.ui.hideMultiplayerControls();
        this.updateUI();
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeApp();
});