export class UI {
    constructor() {
        this.boardElement = document.getElementById('game-board');
        this.statusElement = document.getElementById('status');
        this.scoreXElement = document.getElementById('score-x');
        this.scoreOElement = document.getElementById('score-o');
        this.resetButton = document.getElementById('reset-btn');
        this.newGameButton = document.getElementById('new-game-btn');
        
        this.scores = { X: 0, O: 0 };
        
        // Multiplayer UI elements
        this.multiplayerSection = null;
        this.createMultiplayerUI();
    }

    createMultiplayerUI() {
        // Create multiplayer controls section
        const multiplayerHTML = `
            <div id="multiplayer-section" class="multiplayer-controls">
                <h3>🌐 Online Multiplayer</h3>
                <div class="multiplayer-buttons">
                    <button id="create-room-btn" class="btn btn-primary">Create Room</button>
                    <button id="join-room-btn" class="btn btn-secondary">Join Room</button>
                </div>
                
                <div id="room-info" class="room-info hidden">
                    <div class="room-details">
                        <p><strong>Room Code:</strong> <span id="room-code"></span></p>
                        <p><strong>Your Symbol:</strong> <span id="player-symbol"></span></p>
                        <p id="player-status">Waiting for opponent...</p>
                    </div>
                    <div class="invite-section">
                        <p>Invite a friend:</p>
                        <div class="invite-link-container">
                            <input type="text" id="invite-link" readonly class="invite-link">
                            <button id="copy-link-btn" class="btn btn-small">Copy Link</button>
                        </div>
                    </div>
                </div>
                
                <div id="join-room-input" class="join-room-input hidden">
                    <input type="text" id="room-code-input" placeholder="Enter room code" maxlength="8">
                    <button id="join-room-submit" class="btn btn-primary">Join</button>
                    <button id="cancel-join" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        // Insert multiplayer section before the game board
        const container = document.querySelector('.container main');
        const gameInfo = document.querySelector('.game-info');
        gameInfo.insertAdjacentHTML('afterend', multiplayerHTML);
        
        this.multiplayerSection = document.getElementById('multiplayer-section');
        this.setupMultiplayerEventListeners();
    }

    setupMultiplayerEventListeners() {
        // Create room button
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.onCreateRoom && this.onCreateRoom();
        });

        // Join room button
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.showJoinRoomInput();
        });

        // Join room submit
        document.getElementById('join-room-submit').addEventListener('click', () => {
            const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
            if (roomCode) {
                this.onJoinRoom && this.onJoinRoom(roomCode);
            }
        });

        // Cancel join
        document.getElementById('cancel-join').addEventListener('click', () => {
            this.hideJoinRoomInput();
        });

        // Copy invite link
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            this.copyInviteLink();
        });
    }

    showJoinRoomInput() {
        document.getElementById('join-room-input').classList.remove('hidden');
        document.getElementById('room-code-input').focus();
    }

    hideJoinRoomInput() {
        document.getElementById('join-room-input').classList.add('hidden');
        document.getElementById('room-code-input').value = '';
    }

    showRoomInfo(roomCode, playerSymbol, inviteLink) {
        document.getElementById('room-code').textContent = roomCode;
        document.getElementById('player-symbol').textContent = playerSymbol;
        document.getElementById('invite-link').value = inviteLink;
        document.getElementById('room-info').classList.remove('hidden');
        this.hideJoinRoomInput();
    }

    updatePlayerStatus(status) {
        document.getElementById('player-status').textContent = status;
    }

    copyInviteLink() {
        const inviteLink = document.getElementById('invite-link');
        inviteLink.select();
        inviteLink.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(inviteLink.value).then(() => {
            const copyBtn = document.getElementById('copy-link-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }

    hideMultiplayerControls() {
        document.getElementById('room-info').classList.add('hidden');
        this.hideJoinRoomInput();
    }

    // Existing methods...
    updateBoard(board) {
        const cells = this.boardElement.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const value = board[index];
            cell.textContent = value;
            
            // Add player-specific styling
            if (value) {
                cell.setAttribute('data-player', value);
                cell.classList.add('disabled');
                // Add entrance animation
                cell.classList.add('cell-enter');
                setTimeout(() => cell.classList.remove('cell-enter'), 300);
            } else {
                cell.removeAttribute('data-player');
                cell.classList.remove('disabled');
            }
        });
    }

    updateStatus(message, type = '') {
        this.statusElement.textContent = message;
        this.statusElement.className = 'status';
        
        if (type) {
            this.statusElement.classList.add(type);
        }
    }

    updateScores() {
        this.scoreXElement.textContent = this.scores.X;
        this.scoreOElement.textContent = this.scores.O;
    }

    incrementScore(player) {
        this.scores[player]++;
        this.updateScores();
    }

    resetScores() {
        this.scores = { X: 0, O: 0 };
        this.updateScores();
    }

    highlightWinningCells(winningPattern) {
        if (!winningPattern) return;
        
        const cells = this.boardElement.querySelectorAll('.cell');
        winningPattern.forEach(index => {
            cells[index].classList.add('winning');
        });
    }

    clearWinningHighlight() {
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('winning');
        });
    }

    disableBoard() {
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.add('disabled');
        });
    }

    enableBoard() {
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (!cell.textContent) {
                cell.classList.remove('disabled');
            }
        });
    }

    addCellClickHandler(handler) {
        this.boardElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !e.target.classList.contains('disabled')) {
                const index = parseInt(e.target.dataset.index);
                handler(index);
            }
        });
    }

    addResetHandler(handler) {
        this.resetButton.addEventListener('click', handler);
    }

    addNewGameHandler(handler) {
        this.newGameButton.addEventListener('click', handler);
    }

    // Multiplayer event handlers
    onCreateRoom = null;
    onJoinRoom = null;
}