import Matter from 'matter-js';
import type { ShelfCell } from '@/types/game';
import { DisplayCard } from './DisplayCard';
import { ShelfGrid } from './ShelfGrid';

export class PhysicsManager {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Map<string, Matter.Body> = new Map();
  private sensors: Map<string, Matter.Body> = new Map();
  private shelfGrid: ShelfGrid | null = null;
  private snapDistance: number = 50;
  private isEnabled: boolean = true;

  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.gravity.y = 0;
  }

  init(shelfGrid: ShelfGrid): void {
    this.shelfGrid = shelfGrid;
    this.createShelfSensors();
  }

  private createShelfSensors(): void {
    if (!this.shelfGrid) return;
    const cells = this.shelfGrid.getFlatCells();
    cells.forEach(cell => {
      const sensor = Matter.Bodies.rectangle(
        cell.x + cell.width / 2,
        cell.y + cell.height / 2,
        cell.width,
        cell.height,
        {
          isStatic: true,
          isSensor: true,
          label: `sensor-${cell.row}-${cell.col}`,
          render: {
            fillStyle: 'transparent',
          },
        }
      );
      this.sensors.set(`sensor-${cell.row}-${cell.col}`, sensor);
      Matter.World.add(this.world, sensor);
    });
  }

  createCardBody(card: DisplayCard): Matter.Body {
    const body = Matter.Bodies.rectangle(
      card.getCenterX(),
      card.getCenterY(),
      card.getWidth(),
      card.getHeight(),
      {
        label: `card-${card.getId()}`,
        friction: 0.1,
        frictionAir: 0.1,
        restitution: 0.1,
        render: {
          fillStyle: card.getMedicine().color,
        },
      }
    );
    this.bodies.set(card.getId(), body);
    Matter.World.add(this.world, body);
    return body;
  }

  removeCardBody(cardId: string): void {
    const body = this.bodies.get(cardId);
    if (body) {
      Matter.World.remove(this.world, body);
      this.bodies.delete(cardId);
    }
  }

  updateCardPosition(cardId: string, x: number, y: number): void {
    const body = this.bodies.get(cardId);
    if (body) {
      Matter.Body.setPosition(body, { x, y });
    }
  }

  snapToNearestCell(card: DisplayCard): ShelfCell | null {
    if (!this.shelfGrid) return null;
    const nearestCell = this.shelfGrid.getNearestCell(card.getCenterX(), card.getCenterY());
    if (!nearestCell) return null;
    const distance = Math.sqrt(
      Math.pow(card.getCenterX() - (nearestCell.x + nearestCell.width / 2), 2) +
      Math.pow(card.getCenterY() - (nearestCell.y + nearestCell.height / 2), 2)
    );
    if (distance <= this.snapDistance && !nearestCell.occupiedBy) {
      const targetX = nearestCell.x + (nearestCell.width - card.getWidth()) / 2;
      const targetY = nearestCell.y + (nearestCell.height - card.getHeight()) / 2;
      this.applySnapForce(card.getId(), targetX + card.getWidth() / 2, targetY + card.getHeight() / 2);
      return nearestCell;
    }
    return null;
  }

  private applySnapForce(bodyId: string, targetX: number, targetY: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    const force = 0.05;
    const dx = targetX - body.position.x;
    const dy = targetY - body.position.y;
    Matter.Body.applyForce(body, body.position, {
      x: dx * force * body.mass,
      y: dy * force * body.mass,
    });
  }

  getBodyPosition(cardId: string): { x: number; y: number } | null {
    const body = this.bodies.get(cardId);
    if (body) {
      return { x: body.position.x, y: body.position.y };
    }
    return null;
  }

  setBodyVelocity(cardId: string, vx: number, vy: number): void {
    const body = this.bodies.get(cardId);
    if (body) {
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    }
  }

  update(deltaTime: number = 16.66): void {
    if (!this.isEnabled) return;
    Matter.Engine.update(this.engine, deltaTime);
    this.bodies.forEach((body, cardId) => {
      const bodyPos = body.position;
      if (bodyPos.x < 0) {
        Matter.Body.setPosition(body, { x: 50, y: bodyPos.y });
        Matter.Body.setVelocity(body, { x: 0, y: body.velocity.y });
      }
    });
  }

  checkCollision(cardId: string): { cell: ShelfCell | null; isOccupied: boolean } {
    if (!this.shelfGrid) return { cell: null, isOccupied: false };
    const body = this.bodies.get(cardId);
    if (!body) return { cell: null, isOccupied: false };
    const cell = this.shelfGrid.getCellAtPosition(body.position.x, body.position.y);
    if (cell) {
      return {
        cell,
        isOccupied: cell.occupiedBy !== null && cell.occupiedBy !== cardId,
      };
    }
    return { cell: null, isOccupied: false };
  }

  clear(): void {
    this.bodies.forEach(body => Matter.World.remove(this.world, body));
    this.sensors.forEach(sensor => Matter.World.remove(this.world, sensor));
    this.bodies.clear();
    this.sensors.clear();
    this.shelfGrid = null;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getSnapDistance(): number {
    return this.snapDistance;
  }

  setSnapDistance(distance: number): void {
    this.snapDistance = distance;
  }
}
