import type { ShelfCell, Level } from '@/types/game';

export class ShelfGrid {
  private cells: ShelfCell[][] = [];
  private rows: number;
  private cols: number;
  private cellWidth: number;
  private cellHeight: number;
  private startX: number;
  private startY: number;
  private gap: number = 8;

  constructor(level: Level, startX: number = 100, startY: number = 150, cellWidth: number = 120, cellHeight: number = 100) {
    this.rows = level.shelfRows;
    this.cols = level.shelfCols;
    this.startX = startX;
    this.startY = startY;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.initializeCells();
  }

  private initializeCells(): void {
    this.cells = [];
    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const x = this.startX + col * (this.cellWidth + this.gap);
        const y = this.startY + row * (this.cellHeight + this.gap);
        this.cells[row][col] = {
          row,
          col,
          x,
          y,
          width: this.cellWidth,
          height: this.cellHeight,
          occupiedBy: null,
          isHighlighted: false,
        };
      }
    }
  }

  getCell(row: number, col: number): ShelfCell | undefined {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.cells[row][col];
    }
    return undefined;
  }

  getCellAtPosition(x: number, y: number): ShelfCell | undefined {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        if (
          x >= cell.x &&
          x <= cell.x + cell.width &&
          y >= cell.y &&
          y <= cell.y + cell.height
        ) {
          return cell;
        }
      }
    }
    return undefined;
  }

  getNearestCell(x: number, y: number): ShelfCell | undefined {
    let nearest: ShelfCell | undefined;
    let minDistance = Infinity;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        const centerX = cell.x + cell.width / 2;
        const centerY = cell.y + cell.height / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance < minDistance && !cell.occupiedBy) {
          minDistance = distance;
          nearest = cell;
        }
      }
    }
    return nearest;
  }

  getCells(): ShelfCell[][] {
    return this.cells;
  }

  getFlatCells(): ShelfCell[] {
    return this.cells.flat();
  }

  setOccupied(row: number, col: number, cardId: string | null): boolean {
    const cell = this.getCell(row, col);
    if (cell) {
      cell.occupiedBy = cardId;
      return true;
    }
    return false;
  }

  isCellOccupied(row: number, col: number): boolean {
    const cell = this.getCell(row, col);
    return cell?.occupiedBy !== null;
  }

  highlightCell(row: number, col: number, highlighted: boolean): void {
    const cell = this.getCell(row, col);
    if (cell) {
      cell.isHighlighted = highlighted;
    }
  }

  highlightAllCells(highlighted: boolean): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col].isHighlighted = highlighted;
      }
    }
  }

  setCellCorrect(row: number, col: number, isCorrect: boolean): void {
    const cell = this.getCell(row, col);
    if (cell) {
      cell.isCorrect = isCorrect;
      cell.isError = !isCorrect;
    }
  }

  clearAllStates(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        cell.occupiedBy = null;
        cell.isHighlighted = false;
        cell.isCorrect = undefined;
        cell.isError = undefined;
      }
    }
  }

  getEmptyCells(): ShelfCell[] {
    return this.getFlatCells().filter(cell => !cell.occupiedBy);
  }

  getOccupiedCells(): ShelfCell[] {
    return this.getFlatCells().filter(cell => cell.occupiedBy !== null);
  }

  getTotalCells(): number {
    return this.rows * this.cols;
  }

  getOccupiedCount(): number {
    return this.getOccupiedCells().length;
  }

  getRows(): number {
    return this.rows;
  }

  getCols(): number {
    return this.cols;
  }

  getWidth(): number {
    return this.cols * (this.cellWidth + this.gap) - this.gap;
  }

  getHeight(): number {
    return this.rows * (this.cellHeight + this.gap) - this.gap;
  }

  getCellWidth(): number {
    return this.cellWidth;
  }

  getCellHeight(): number {
    return this.cellHeight;
  }

  resize(startX: number, startY: number, cellWidth: number, cellHeight: number): void {
    this.startX = startX;
    this.startY = startY;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        cell.x = this.startX + col * (this.cellWidth + this.gap);
        cell.y = this.startY + row * (this.cellHeight + this.gap);
        cell.width = this.cellWidth;
        cell.height = this.cellHeight;
      }
    }
  }
}
