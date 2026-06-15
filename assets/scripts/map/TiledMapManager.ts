import { _decorator, Component, Node, TiledMap, TiledTile, Vec3, UITransform } from 'cc';
import { Singleton } from '../core/Singleton';
import { Classroom, RoomStatus, Weekday, TimeSlot } from '../types';
const { ccclass, property } = _decorator;

interface TileInfo {
  x: number;
  y: number;
  gid: number;
  properties: Record<string, string | number | boolean>;
}

@ccclass('TiledMapManager')
export class TiledMapManager extends Singleton<TiledMapManager> {
  private _tiledMap: TiledMap | null = null;
  private _classrooms: Map<string, Classroom> = new Map();
  private _tileSize: { width: number; height: number } = { width: 0, height: 0 };
  private _mapSize: { width: number; height: number } = { width: 0, height: 0 };

  get classrooms(): Classroom[] {
    return Array.from(this._classrooms.values());
  }

  get classroomCount(): number {
    return this._classrooms.size;
  }

  init(tiledMap: TiledMap): void {
    this._tiledMap = tiledMap;
    this._tileSize = {
      width: tiledMap.getTileSize().width,
      height: tiledMap.getTileSize().height,
    };
    this._mapSize = {
      width: tiledMap.getMapSize().width,
      height: tiledMap.getMapSize().height,
    };
    this.parseClassrooms();
  }

  private parseClassrooms(): void {
    if (!this._tiledMap) return;

    const objectGroup = this._tiledMap.getObjectGroup('classrooms');
    if (!objectGroup) {
      console.warn('Classroom object group not found in Tiled map');
      return;
    }

    const objects = objectGroup.getObjects();
    objects.forEach((obj, index) => {
      const classroom: Classroom = {
        id: obj.name || `classroom_${index}`,
        name: obj.name || `教室${index + 1}`,
        building: obj.properties?.building || '主教学楼',
        capacity: obj.properties?.capacity || 40,
        equipment: this.parseEquipment(obj.properties?.equipment),
        schedule: new Map(),
        status: 'available',
        position: {
          x: obj.offset.x + obj.width / 2,
          y: this._mapSize.height * this._tileSize.height - obj.offset.y - obj.height / 2,
        },
      };
      this._classrooms.set(classroom.id, classroom);
    });

    if (this._classrooms.size === 0) {
      this.generateDefaultClassrooms();
    }
  }

  private parseEquipment(equipmentStr: string | undefined): string[] {
    if (!equipmentStr) return [];
    return equipmentStr.split(',').map(e => e.trim()).filter(e => e);
  }

  private generateDefaultClassrooms(): void {
    const defaultClassrooms: Partial<Classroom>[] = [
      { id: 'room_101', name: '101教室', building: '主教学楼', capacity: 60, equipment: ['projector', 'blackboard'] },
      { id: 'room_102', name: '102教室', building: '主教学楼', capacity: 40, equipment: ['projector', 'blackboard'] },
      { id: 'room_201', name: '201实验室', building: '实验楼', capacity: 30, equipment: ['projector', 'blackboard', 'computers'] },
      { id: 'room_202', name: '202实验室', building: '实验楼', capacity: 25, equipment: ['projector', 'lab_equipment'] },
      { id: 'room_301', name: '301多媒体', building: '主教学楼', capacity: 80, equipment: ['projector', 'blackboard', 'sound_system'] },
      { id: 'room_gym', name: '体育馆', building: '体育中心', capacity: 100, equipment: ['sports_equipment'] },
    ];

    const gridSize = 150;
    const startX = 100;
    const startY = 200;

    defaultClassrooms.forEach((room, index) => {
      const classroom: Classroom = {
        id: room.id!,
        name: room.name!,
        building: room.building!,
        capacity: room.capacity!,
        equipment: room.equipment!,
        schedule: new Map(),
        status: 'available',
        position: {
          x: startX + (index % 3) * gridSize,
          y: startY + Math.floor(index / 3) * gridSize,
        },
      };
      this._classrooms.set(classroom.id, classroom);
    });
  }

  getClassroom(classroomId: string): Classroom | undefined {
    return this._classrooms.get(classroomId);
  }

  getClassroomsByEquipment(equipment: string): Classroom[] {
    return this.classrooms.filter(c => c.equipment.includes(equipment));
  }

  getClassroomsByCapacity(minCapacity: number): Classroom[] {
    return this.classrooms.filter(c => c.capacity >= minCapacity);
  }

  isClassroomAvailable(classroomId: string, weekday: Weekday, timeSlot: TimeSlot): boolean {
    const classroom = this._classrooms.get(classroomId);
    if (!classroom) return false;
    if (classroom.status === 'maintenance') return false;
    
    const key = `${weekday}-${timeSlot}`;
    return !classroom.schedule.has(key);
  }

  getClassroomSchedule(classroomId: string): Map<string, string> {
    return this._classrooms.get(classroomId)?.schedule || new Map();
  }

  getAvailableClassrooms(weekday: Weekday, timeSlot: TimeSlot, requiredEquipment: string[] = []): Classroom[] {
    return this.classrooms.filter(classroom => {
      if (classroom.status === 'maintenance') return false;
      
      const key = `${weekday}-${timeSlot}`;
      if (classroom.schedule.has(key)) return false;
      
      return requiredEquipment.every(eq => classroom.equipment.includes(eq));
    });
  }

  occupyClassroom(classroomId: string, weekday: Weekday, timeSlot: TimeSlot, courseId: string): boolean {
    const classroom = this._classrooms.get(classroomId);
    if (!classroom) return false;
    
    const key = `${weekday}-${timeSlot}`;
    if (classroom.schedule.has(key)) return false;
    
    classroom.schedule.set(key, courseId);
    classroom.status = 'occupied';
    return true;
  }

  releaseClassroom(classroomId: string, weekday: Weekday, timeSlot: TimeSlot): boolean {
    const classroom = this._classrooms.get(classroomId);
    if (!classroom) return false;
    
    const key = `${weekday}-${timeSlot}`;
    if (!classroom.schedule.has(key)) return false;
    
    classroom.schedule.delete(key);
    
    if (classroom.schedule.size === 0) {
      classroom.status = 'available';
    }
    return true;
  }

  setClassroomStatus(classroomId: string, status: RoomStatus): boolean {
    const classroom = this._classrooms.get(classroomId);
    if (!classroom) return false;
    classroom.status = status;
    return true;
  }

  setClassroomMaintenance(classroomId: string, isMaintenance: boolean): boolean {
    return this.setClassroomStatus(classroomId, isMaintenance ? 'maintenance' : 'available');
  }

  getClassroomAtPosition(worldPos: Vec3): Classroom | undefined {
    const touchRadius = 50;
    
    for (const classroom of this._classrooms.values()) {
      const dx = worldPos.x - classroom.position.x;
      const dy = worldPos.y - classroom.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < touchRadius) {
        return classroom;
      }
    }
    return undefined;
  }

  getTileInfo(layerName: string, x: number, y: number): TileInfo | null {
    if (!this._tiledMap) return null;
    
    const layer = this._tiledMap.getLayer(layerName);
    if (!layer) return null;
    
    const tile = layer.getTiledTileAt(x, y, true);
    if (!tile) return null;
    
    const tileProperties = this._tiledMap.getPropertiesForGID(tile.grid) || {};
    
    return {
      x,
      y,
      gid: tile.grid,
      properties: tileProperties as Record<string, string | number | boolean>,
    };
  }

  worldToTile(worldPos: Vec3): { x: number; y: number } {
    return {
      x: Math.floor(worldPos.x / this._tileSize.width),
      y: Math.floor(worldPos.y / this._tileSize.height),
    };
  }

  tileToWorld(tileX: number, tileY: number): Vec3 {
    return new Vec3(
      tileX * this._tileSize.width + this._tileSize.width / 2,
      tileY * this._tileSize.height + this._tileSize.height / 2,
      0
    );
  }

  reset(): void {
    this._classrooms.forEach(classroom => {
      classroom.schedule.clear();
      classroom.status = 'available';
    });
  }

  destroy(): void {
    this._tiledMap = null;
    this._classrooms.clear();
  }
}
