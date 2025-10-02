import { UI } from '../src/js/ui.js';

describe('UI Class', () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-board"></div>
            <div id="message"></div>
        `;
        ui = new UI();
    });

    test('should update the board correctly', () => {
        const board = [
            ['X', 'O', 'X'],
            ['O', 'X', 'O'],
            ['X', '', 'O']
        ];
        ui.updateBoard(board);
        const cells = document.querySelectorAll('#game-board div');
        expect(cells[0].textContent).toBe('X');
        expect(cells[1].textContent).toBe('O');
        expect(cells[2].textContent).toBe('X');
        expect(cells[3].textContent).toBe('O');
        expect(cells[4].textContent).toBe('X');
        expect(cells[5].textContent).toBe('');
        expect(cells[6].textContent).toBe('O');
    });

    test('should show a message', () => {
        ui.showMessage('Player X wins!');
        const message = document.getElementById('message').textContent;
        expect(message).toBe('Player X wins!');
    });
});