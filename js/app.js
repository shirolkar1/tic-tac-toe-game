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
        const gameData = urlParams.get('data');
        
        if (roomCode) {
            console.log('Found room invite in URL:', roomCode);
            if (gameData) {
                console.log('Room invite includes game data for cross-device sync');
            }
            
            // Auto-join room from invite link
            setTimeout(() => {
                this.joinMultiplayerRoom(roomCode);
            }, 1000);
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
        try {
            this.multiplayerGame = new FirebaseMultiplayer();
            
            // Set up real-time listener
            this.multiplayerGame.onGameUpdate = (gameState) => {
                this.updateMultiplayerUI(gameState);
            };
            
            this.ui.updateStatus('Joining room...', '');
            const success = await this.multiplayerGame.joinRoom(roomCode);
            
            if (success) {
                this.isMultiplayerMode = true;
                const inviteLink = this.multiplayerGame.getInviteLink();
                this.ui.showRoomInfo(roomCode, 'O', inviteLink);
                this.ui.updatePlayerStatus('Connected! Game ready.');
                
                const gameState = this.multiplayerGame.getGameState();
                this.updateMultiplayerUI(gameState);
                this.ui.updateStatus('Successfully joined the game!');
            } else {
                this.ui.updateStatus('Room not found! Please check the room code.', 'error');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            this.ui.updateStatus('Error joining room. Please try again.', 'error');
        }
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