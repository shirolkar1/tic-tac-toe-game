class Board {
    constructor() {
        this.cells = Array(9).fill(null);
    }

    render() {
        const boardElement = document.createElement('div');
        boardElement.classList.add('board');

        this.cells.forEach((cell, index) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.index = index;
            cellElement.textContent = cell ? cell : '';
            boardElement.appendChild(cellElement);
        });

        return boardElement;
    }

    updateCell(index, symbol) {
        if (this.cells[index] === null) {
            this.cells[index] = symbol;
        }
    }

    reset() {
        this.cells.fill(null);
    }
}

export default Board;