import { Game } from '../src/js/game';

describe('Game Class', () => {
    let game;

    beforeEach(() => {
        game = new Game();
    });

    test('should initialize the game correctly', () => {
        expect(game.board).toEqual(['', '', '', '', '', '', '', '', '']);
        expect(game.currentPlayer).toBe('X');
        expect(game.winner).toBe(null);
    });

    test('should make a move', () => {
        game.makeMove(0);
        expect(game.board[0]).toBe('X');
        expect(game.currentPlayer).toBe('O');
    });

    test('should not allow a move in an occupied cell', () => {
        game.makeMove(0);
        const result = game.makeMove(0);
        expect(result).toBe(false);
        expect(game.board[0]).toBe('X');
    });

    test('should check for a winner', () => {
        game.makeMove(0);
        game.makeMove(1);
        game.makeMove(3);
        game.makeMove(4);
        game.makeMove(6);
        expect(game.checkWinner()).toBe('X');
    });

    test('should reset the game', () => {
        game.makeMove(0);
        game.resetGame();
        expect(game.board).toEqual(['', '', '', '', '', '', '', '', '']);
        expect(game.currentPlayer).toBe('X');
        expect(game.winner).toBe(null);
    });
});