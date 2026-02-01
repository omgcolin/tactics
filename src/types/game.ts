export type Position = {
    x: number;
    y: number;
};

export type Turn = 'player' | 'enemy';

export type TerrainType = 'plains' | 'mountain' | 'water' | 'forest';

export type Unit = {
    id: string;
    name: string;
    position: Position;
    hp: number;
    maxHp: number;
    moveRange: number;
    attackRange: number;
    damage: number;
    team: 'player' | 'enemy';
    emoji: string;
    sprite?: string;
    sizeMultiplier?: number;
    stunned?: boolean; // For collision effects
};

export type TileData = {
    position: Position;
    terrain: TerrainType;
    unit?: Unit;
};
