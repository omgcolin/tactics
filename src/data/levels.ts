import type { Unit, TerrainType } from '../types/game';

export interface HowToPlaySection {
    title: string;
    content: string;
}

export interface LevelData {
    id: number;
    name: string;
    description: string;
    gridSize: number;
    units: Unit[];
    mapSetup: (x: number, y: number) => TerrainType;
    unlocksId?: number;
    overworldPosition: { x: number; y: number };
    howToPlay: HowToPlaySection[];
}

export const LEVELS: LevelData[] = [
    {
        id: 1,
        name: "Forest Ambush",
        description: "A group of skeletons has attacked you with bows. Use the environment as a shield against their arrows.",
        gridSize: 10,
        units: [
            {
                id: 'hero',
                name: 'Hero',
                position: { x: 4, y: 9 },
                hp: 1,
                maxHp: 1,
                moveRange: 3,
                attackRange: 1,
                damage: 5,
                team: 'player',
                emoji: '🛡️',
                sprite: '/knight_transparent.png',
                sizeMultiplier: 2.5
            },
            {
                id: 'skel1',
                name: 'Archer',
                position: { x: 1, y: 3 },
                hp: 4,
                maxHp: 4,
                moveRange: 2,
                attackRange: 2,
                damage: 4,
                team: 'enemy',
                emoji: '🏹'
            },
            {
                id: 'skel2',
                name: 'Archer',
                position: { x: 8, y: 3 },
                hp: 4,
                maxHp: 4,
                moveRange: 2,
                attackRange: 2,
                damage: 4,
                team: 'enemy',
                emoji: '🏹'
            },
            {
                id: 'skel3',
                name: 'Archer',
                position: { x: 5, y: 1 },
                hp: 4,
                maxHp: 4,
                moveRange: 2,
                attackRange: 2,
                damage: 4,
                team: 'enemy',
                emoji: '🏹'
            }
        ],
        mapSetup: (x, y) => {
            if (x === 4 && y === 5) return 'mountain';
            if (x === 5 && y === 5) return 'mountain';
            if (x === 4 && y === 6) return 'mountain';
            if (x === 5 && y === 6) return 'mountain';
            if (x === 2 && y === 6) return 'mountain';
            if (x === 2 && y === 5) return 'forest';
            if (x === 7 && y === 6) return 'mountain';
            if (x === 7 && y === 5) return 'forest';
            if (x === 1 && y === 3) return 'forest';
            if (x === 8 && y === 3) return 'forest';
            if (x === 5 && y === 1) return 'forest';
            if (y === 0) return 'water';
            return 'plains';
        },
        unlocksId: 2,
        overworldPosition: { x: 13, y: 18 },
        howToPlay: [
            {
                title: "1. Objective",
                content: "Eliminate all enemy archers to win the level."
            },
            {
                title: "2. Movement",
                content: "Click your hero to see valid moves (blue highlights). Different terrain costs movement points. Plains cost 1, forests cost 2, while water and mountains are impassable. Use mountain cover to protect yourself from arrows."
            },
            {
                title: "3. How to Attack",
                content: "Click on an enemy unit within your attack range to attack. Your sword has 1-tile range and deals 1 damage per hit. You can attack once per turn, so choose your targets carefully."
            },
            {
                title: "4. Enemy Units",
                content: "You face archers with 2-tile attack range and one hit kill. They will move toward you if out of range, then attack simultaneously. Each can be defeated with one hit from your sword."
            },
            {
                title: "5. Attack Range Visualization",
                content: "Hover over any enemy unit to see their attack range highlighted in red. This helps you plan safe movement routes and identify which enemies can reach you before you engage in combat."
            }
        ]
    },
    {
        id: 2,
        name: "Mountain Pass",
        description: "Shieldbearers immune to your sword block your path; use your BASH (2-tile knockback) to eliminate them by knocking them into the water through direct pushes and strategic chain reactions.",
        gridSize: 10,
        units: [
            {
                id: 'hero',
                name: 'Hero',
                position: { x: 4, y: 8 },
                hp: 1,
                maxHp: 1,
                moveRange: 3,
                attackRange: 1,
                damage: 5,
                team: 'player',
                emoji: '🛡️',
                sprite: '/knight_transparent.png',
                sizeMultiplier: 2.5
            },
            {
                id: 'sb1',
                name: 'Undead Shieldbearer',
                position: { x: 2, y: 2 },
                hp: 50,
                maxHp: 50,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            },
            {
                id: 'sb2',
                name: 'Undead Shieldbearer',
                position: { x: 7, y: 2 },
                hp: 50,
                maxHp: 50,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            },
            {
                id: 'sb3',
                name: 'Undead Shieldbearer',
                position: { x: 4, y: 6 },
                hp: 50,
                maxHp: 50,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            },
            {
                id: 'sb4',
                name: 'Undead Shieldbearer',
                position: { x: 5, y: 6 },
                hp: 50,
                maxHp: 50,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            }
        ],
        mapSetup: (x, y) => {
            // Water on all edges (elimination zones)
            if (x === 0 || x === 9 || y === 0 || y === 9) return 'water';

            // Central rock formation - creates narrow passage and positioning challenges
            if ((x === 4 && y === 4) || (x === 5 && y === 4) ||
                (x === 4 && y === 5) || (x === 5 && y === 5)) return 'mountain';

            // Strategic rock formations for chain reactions and positioning
            if ((x === 2 && y === 3) || (x === 7 && y === 3) ||
                (x === 3 && y === 6) || (x === 6 && y === 6)) return 'mountain';

            // Additional obstacles for more complex positioning
            if ((x === 1 && y === 1) || (x === 8 && y === 1) ||
                (x === 1 && y === 8) || (x === 8 && y === 8)) return 'mountain';

            // Strategic defensive mountains for better positioning
            if ((x === 3 && y === 3) || (x === 6 && y === 3) ||
                (x === 4 && y === 3) || (x === 5 && y === 3) ||
                (x === 2 && y === 4) || (x === 7 && y === 4)) return 'mountain';

            // Mountain pathways (plains terrain)
            return 'plains';
        },
        unlocksId: 3,
        overworldPosition: { x: 15, y: 11 },
        howToPlay: [
            {
                title: "1. Objective",
                content: "Eliminate all shieldbearers to clear the mountain pass."
            },
            {
                title: "2. Bash",
                content: "Your shield bash knocks enemies 2 tiles away. Attack carefully to maximize knockback distance and direction."
            },
            {
                title: "3. Individual Bashes and Stun",
                content: "When you bash an enemy they become stunned. Stunned units skip their next turn. Use stunning to temporarily remove threats from combat."
            },
            {
                title: "4. Mountain Stuns",
                content: "If you bash an enemy into a mountain tile, they become stunned."
            },
            {
                title: "5. Chain Reactions",
                content: "If a bashed unit collides with another unit during knockback, only the unit being bashed gets stunned. Chain reactions can knock multiple units but only stun the primary target."
            },
            {
                title: "6. Water Elimination",
                content: "Knocking enemies into water eliminates them instantly."
            }
        ]
    },
    {
        id: 3,
        name: "The Crossfire",
        description: "Archers take cover and take shots while shieldbearers block routes. Use everything you have learned strategically to survive this deadly crossfire.",
        gridSize: 11,
        units: [
            {
                id: 'hero',
                name: 'Hero',
                position: { x: 5, y: 9 },
                hp: 1,
                maxHp: 1,
                moveRange: 3,
                attackRange: 1,
                damage: 5,
                team: 'player',
                emoji: '🛡️',
                sprite: '/knight_transparent.png',
                sizeMultiplier: 2.5
            },
            {
                id: 'archer1',
                name: 'Archer',
                position: { x: 2, y: 1 },
                hp: 4,
                maxHp: 4,
                moveRange: 2,
                attackRange: 2,
                damage: 4,
                team: 'enemy',
                emoji: '🏹'
            },
            {
                id: 'archer2',
                name: 'Archer',
                position: { x: 8, y: 1 },
                hp: 4,
                maxHp: 4,
                moveRange: 2,
                attackRange: 2,
                damage: 4,
                team: 'enemy',
                emoji: '🏹'
            },
            {
                id: 'sb1',
                name: 'Shieldbearer',
                position: { x: 3, y: 5 },
                hp: 8,
                maxHp: 8,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            },
            {
                id: 'sb2',
                name: 'Shieldbearer',
                position: { x: 5, y: 6 },
                hp: 8,
                maxHp: 8,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            },
            {
                id: 'sb3',
                name: 'Shieldbearer',
                position: { x: 7, y: 5 },
                hp: 8,
                maxHp: 8,
                moveRange: 2,
                attackRange: 1,
                damage: 1,
                team: 'enemy',
                emoji: '🛡️'
            }
        ],
        mapSetup: (x, y) => {
            // Water on all edges (elimination zones)
            if (x === 0 || x === 10 || y === 0 || y === 10) return 'water';

            // Strategic mountain placement
            if ((x === 4 && y === 4) || (x === 6 && y === 4)) return 'mountain'; // Choke points
            if ((x === 1 && y === 2) || (x === 9 && y === 2)) return 'mountain'; // Archer cover
            if ((x === 3 && y === 7) || (x === 7 && y === 7)) return 'mountain'; // Defensive positions
            if ((x === 2 && y === 6) || (x === 8 && y === 6)) return 'mountain'; // Chain reaction points

            // Enhanced forest cover for strategic positioning
            if ((x === 5 && y === 7) || (x === 4 && y === 8) || (x === 6 && y === 8)) return 'forest'; // Near start
            if ((x === 3 && y === 6) || (x === 7 && y === 6) || (x === 2 && y === 7) || (x === 8 && y === 7)) return 'forest'; // Mid-map
            if ((x === 3 && y === 3) || (x === 7 && y === 3)) return 'forest'; // Archer elimination
            if ((x === 4 && y === 5) || (x === 6 && y === 5)) return 'forest'; // Mountain approach cover

            // Rest is plains
            return 'plains';
        },
        overworldPosition: { x: 11, y: 4 },
        howToPlay: [
            {
                title: "1. Objective: Combined Threat Elimination",
                content: "Eliminate all enemies to survive the crossfire. Prioritize archers first, then deal with shieldbearers."
            },
            {
                title: "2. Terrain Mastery: Cover and Movement",
                content: "Use mountains for cover from arrows. Forests slow down enemies but also yourself! Water edges eliminate enemies on contact."
            },
            {
                title: "3. Ranged Threat Management",
                content: "Apply Forest Ambush tactics: hover over archers to see their range (red highlight). Use forest or mountain cover to approach safely, then eliminate by either bashing a shieldbearer into them, or with your sword."
            },
            {
                title: "4. Melee Threat Control",
                content: "Apply Mountain Pass tactics: use bash to knock shieldbearers 2 tiles. Stun them by hitting mountains or water. Chain reactions can eliminate multiple enemies but only stun the primary target."
            },
            {
                title: "5. Crossfire Execution: Combined Tactics",
                content: "Combine terrain usage with sword and bash positioning to eliminate threats efficiently."
            }
        ]
    }
];
