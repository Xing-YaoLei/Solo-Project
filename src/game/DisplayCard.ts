import type { Medicine, DisplayCardData } from '@/types/game';

export class DisplayCard {
  private data: DisplayCardData;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private originalX: number;
  private originalY: number;

  constructor(
    id: string,
    medicine: Medicine,
    x: number,
    y: number,
    width: number = 100,
    height: number = 80
  ) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.width = width;
    this.height = height;
    this.data = {
      id,
      medicineId: medicine.id,
      medicine,
      isPlaced: false,
      isSelected: false,
      isDragging: false,
    };
  }

  getId(): string {
    return this.data.id;
  }

  getMedicine(): Medicine {
    return this.data.medicine;
  }

  getMedicineId(): string {
    return this.data.medicineId;
  }

  getMedicineCategory(): string {
    return this.data.medicine.category;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getCenterX(): number {
    return this.x + this.width / 2;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  getOriginalPosition(): { x: number; y: number } {
    return { x: this.originalX, y: this.originalY };
  }

  setOriginalPosition(x: number, y: number): void {
    this.originalX = x;
    this.originalY = y;
  }

  resetPosition(): void {
    this.x = this.originalX;
    this.y = this.originalY;
  }

  isPlaced(): boolean {
    return this.data.isPlaced;
  }

  setPlaced(placed: boolean, cell?: { row: number; col: number }): void {
    this.data.isPlaced = placed;
    this.data.placedCell = cell;
  }

  getPlacedCell(): { row: number; col: number } | undefined {
    return this.data.placedCell;
  }

  isSelected(): boolean {
    return this.data.isSelected;
  }

  setSelected(selected: boolean): void {
    this.data.isSelected = selected;
  }

  isDragging(): boolean {
    return this.data.isDragging;
  }

  setDragging(dragging: boolean): void {
    this.data.isDragging = dragging;
  }

  containsPoint(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  getData(): DisplayCardData {
    return { ...this.data };
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
