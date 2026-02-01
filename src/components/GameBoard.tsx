import React, { useState, useEffect, useCallback } from 'react';
import Tile from './Tile';
import type { TileData, Unit, Position, Turn } from '../types/game';
import type { LevelData } from '../data/levels';

// Audio Context - created on first user interaction
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

function playSound(type: 'sword' | 'bash' | 'collision') {
    const context = getAudioContext();

    // Resume audio context if it's suspended (requires user interaction)
    if (context.state === 'suspended') {
        context.resume();
    }

    const sampleRate = context.sampleRate;
    const duration = type === 'sword' ? 0.3 : type === 'bash' ? 0.6 : 0.8;
    const frameCount = sampleRate * duration;
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
        case 'sword':
            // Sharp metal slice sound - high frequency, very quick attack
            for (let i = 0; i < frameCount; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 25); // Very quick decay for slice effect
                const frequency = 1200 + Math.sin(t * 100) * 400; // High frequency with modulation
                const sliceNoise = (Math.random() - 0.5) * 0.05; // Small noise for metal slice effect
                data[i] = envelope * (Math.sin(2 * Math.PI * frequency * t) + sliceNoise) * 0.0625; // Reduced by 75% (50% of previous 50%)
            }
            break;

        case 'bash':
            // Metal hitting metal - sharp clang with metallic resonance
            for (let i = 0; i < frameCount; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 10); // Medium decay for metallic ring
                const frequency = 400 + Math.sin(t * 80) * 200; // Mid-high frequency for metal clang
                const metalNoise = (Math.random() - 0.5) * 0.15; // More noise for metallic texture
                const ring = Math.sin(2 * Math.PI * 600 * t) * 0.1; // High frequency ring
                data[i] = envelope * (Math.sin(2 * Math.PI * frequency * t) + metalNoise + ring) * 0.125; // Reduced by 75% (50% of previous 50%)
            }
            break;

        case 'collision':
            // Lower frequency impact sound - heavy thud
            for (let i = 0; i < frameCount; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 6); // Slower decay for heavy impact
                const frequency = 80 + Math.sin(t * 20) * 30; // Low frequency with slow modulation
                const impactNoise = (Math.random() - 0.5) * 0.2; // More noise for heavy impact
                const lowBoom = Math.sin(2 * Math.PI * 40 * t) * 0.15; // Very low frequency boom
                data[i] = envelope * (Math.sin(2 * Math.PI * frequency * t) + impactNoise + lowBoom) * 0.1125; // Reduced by 75% (50% of previous 50%)
            }
            break;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
}

interface GameBoardProps {
    level: LevelData;
    onWin: () => void;
    onLose: () => void;
    onExit: () => void;
    onRetry: () => void;
    isFinalLevel?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ level, onWin, onLose, onExit, onRetry, isFinalLevel = false }) => {
    const GRID_SIZE = level.gridSize;
    const [grid, setGrid] = useState<TileData[][]>([]);
    const [units, setUnits] = useState<Unit[]>(level.units);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [validMoves, setValidMoves] = useState<Position[]>([]);
    const [currentTurn, setCurrentTurn] = useState<Turn>('player');
    const [showTutorial, setShowTutorial] = useState(true);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [hoveredEnemyUnit, setHoveredEnemyUnit] = useState<Unit | null>(null);

    // Combat State
    const [hasMoved, setHasMoved] = useState(false);
    const [validTargets, setValidTargets] = useState<Position[]>([]);
    const [selectedAction, setSelectedAction] = useState<'attack' | 'shield-bash'>(level.id === 2 ? 'shield-bash' : 'attack');
    const [animatingUnitId, setAnimatingUnitId] = useState<string | null>(null);
    const [animationType, setAnimationType] = useState<'lunge' | 'knockback' | 'slash' | 'bash' | null>(null);

    // Polish State
    const [damageEvents, setDamageEvents] = useState<{ x: number, y: number, amount: number, id: number }[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

    // Sword Slash Animation State
    const [swordPosition, setSwordPosition] = useState<{ x: number, y: number, angle: number, direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' } | null>(null);

    // Shield Bash Animation State
    const [shieldPosition, setShieldPosition] = useState<{ x: number, y: number, angle: number, direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' } | null>(null);

    // Helper function to calculate attack direction
    const calculateAttackDirection = (attacker: Position, target: Position): 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' => {
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;

        if (dx > 0 && dy === 0) return 'right';
        if (dx < 0 && dy === 0) return 'left';
        if (dy > 0 && dx === 0) return 'down';
        if (dy < 0 && dx === 0) return 'up';
        if (dx > 0 && dy < 0) return 'up-right';
        if (dx < 0 && dy < 0) return 'up-left';
        if (dx > 0 && dy > 0) return 'down-right';
        if (dx < 0 && dy > 0) return 'down-left';
        return 'right'; // default
    };

    // Helper function to get CSS custom properties for direction
    const getDirectionalProperties = (direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right') => {
        const properties: Record<string, string> = {};

        switch (direction) {
            case 'right':
                properties['--attack-angle'] = '0deg';
                properties['--attack-direction-x'] = '1';
                properties['--attack-direction-y'] = '0';
                properties['--bash-direction-x'] = '1';
                properties['--bash-direction-y'] = '0';
                break;
            case 'left':
                properties['--attack-angle'] = '180deg';
                properties['--attack-direction-x'] = '-1';
                properties['--attack-direction-y'] = '0';
                properties['--bash-direction-x'] = '-1';
                properties['--bash-direction-y'] = '0';
                break;
            case 'up':
                properties['--attack-angle'] = '-90deg';
                properties['--attack-direction-x'] = '0';
                properties['--attack-direction-y'] = '-1';
                properties['--bash-direction-x'] = '0';
                properties['--bash-direction-y'] = '-1';
                break;
            case 'down':
                properties['--attack-angle'] = '90deg';
                properties['--attack-direction-x'] = '0';
                properties['--attack-direction-y'] = '1';
                properties['--bash-direction-x'] = '0';
                properties['--bash-direction-y'] = '1';
                break;
            case 'up-right':
                properties['--attack-angle'] = '-45deg';
                properties['--attack-direction-x'] = '0.7';
                properties['--attack-direction-y'] = '-0.7';
                properties['--bash-direction-x'] = '0.7';
                properties['--bash-direction-y'] = '-0.7';
                break;
            case 'up-left':
                properties['--attack-angle'] = '135deg';
                properties['--attack-direction-x'] = '-0.7';
                properties['--attack-direction-y'] = '-0.7';
                properties['--bash-direction-x'] = '-0.7';
                properties['--bash-direction-y'] = '-0.7';
                break;
            case 'down-right':
                properties['--attack-angle'] = '45deg';
                properties['--attack-direction-x'] = '0.7';
                properties['--attack-direction-y'] = '0.7';
                properties['--bash-direction-x'] = '0.7';
                properties['--bash-direction-y'] = '0.7';
                break;
            case 'down-left':
                properties['--attack-angle'] = '225deg';
                properties['--attack-direction-x'] = '-0.7';
                properties['--attack-direction-y'] = '0.7';
                properties['--bash-direction-x'] = '-0.7';
                properties['--bash-direction-y'] = '0.7';
                break;
        }

        return properties;
    };

    // --- Line of Sight (Bresenham's Line Algorithm) ---
    const hasLineOfSight = useCallback((start: Position, end: Position, currentGrid: TileData[][]) => {
        let x0 = start.x;
        let y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (x0 === x1 && y0 === y1) break;
            if (!(x0 === start.x && y0 === start.y)) {
                if (currentGrid[y0][x0].terrain === 'mountain') return false;
            }
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return true;
    }, []);

    // Initialize the grid and place units
    useEffect(() => {
        const newGrid: TileData[][] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            const row: TileData[] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                const terrain = level.mapSetup(x, y);
                const unitOnTile = units.find(u => u.position.x === x && u.position.y === y);
                row.push({ position: { x, y }, terrain, unit: unitOnTile });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
    }, [units, level, GRID_SIZE]);

    // Check Win/Loss Condition
    useEffect(() => {
        // Don't check win/loss conditions if game is already in terminal state
        if (gameState !== 'playing') return;

        const playerUnit = units.find(u => u.team === 'player');
        const enemies = units.filter(u => u.team === 'enemy');

        if (!playerUnit) {
            setGameState('lost');
            const timer = setTimeout(onLose, 2000);
            return () => clearTimeout(timer);
        } else if (enemies.length === 0) {
            setGameState('won');
            const timer = setTimeout(onWin, 2000);
            return () => clearTimeout(timer);
        }
    }, [units, onWin, onLose, gameState]);

    // Remove stun status at the end of enemy turn (not player turn)
    useEffect(() => {
        if (currentTurn === 'player' && gameState === 'playing') {
            // Enemy turn ended, remove stun from all units
            setUnits(prev => prev.map(u => ({ ...u, stunned: false })));
        }
    }, [currentTurn, gameState]);

    // --- Pathfinding Logic (BFS) ---
    const getValidMoves = useCallback((unit: Unit, currentGrid: TileData[][]) => {
        // Skip movement if unit is stunned
        if (unit.stunned) return [];

        // Check if unit starts on forest terrain (archers are exempt as they'd be stuck)
        const startsOnForest = unit.emoji !== '🏹' && currentGrid[unit.position.y][unit.position.x].terrain === 'forest';

        const startNode = { x: unit.position.x, y: unit.position.y, curCost: 0 };
        const queue = [startNode];
        const visited = new Set<string>();
        visited.add(`${unit.position.x}-${unit.position.y}`);
        const valid: Position[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.curCost > 0) valid.push({ x: current.x, y: current.y });


            [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ].forEach(neighbor => {
                if (neighbor.x < 0 || neighbor.x >= GRID_SIZE || neighbor.y < 0 || neighbor.y >= GRID_SIZE) return;
                const tile = currentGrid[neighbor.y][neighbor.x];
                const isBlocked = units.some(u => u.position.x === neighbor.x && u.position.y === neighbor.y);
                if (tile.terrain === 'water' || tile.terrain === 'mountain' || isBlocked) return;

                // Calculate movement cost
                let cost = tile.terrain === 'forest' ? 2 : 1;

                // Special handling for forest exit
                if (current.curCost === 0 && startsOnForest) {
                    // When starting on forest, moving to any adjacent tile costs 2 (forest exit)
                    // This should consume the entire movement for units with 2 movement
                    cost = 2; // Forest exit cost

                    // If unit has exactly 2 movement, they can only move one tile
                    if (unit.moveRange === 2) {
                        if (current.curCost + cost <= unit.moveRange) {
                            if (!visited.has(`${neighbor.x}-${neighbor.y}`)) {
                                visited.add(`${neighbor.x}-${neighbor.y}`);
                                queue.push({ ...neighbor, curCost: current.curCost + cost });
                            }
                        }
                    } else {
                        // Units with more than 2 movement can move normally after forest exit
                        if (current.curCost + cost <= unit.moveRange) {
                            if (!visited.has(`${neighbor.x}-${neighbor.y}`)) {
                                visited.add(`${neighbor.x}-${neighbor.y}`);
                                queue.push({ ...neighbor, curCost: current.curCost + cost });
                            }
                        }
                    }
                } else {
                    // Normal movement (not starting from forest)
                    if (current.curCost + cost <= unit.moveRange) {
                        if (!visited.has(`${neighbor.x}-${neighbor.y}`)) {
                            visited.add(`${neighbor.x}-${neighbor.y}`);
                            queue.push({ ...neighbor, curCost: current.curCost + cost });
                        }
                    }
                }
            });
        }
        return valid;
    }, [units, GRID_SIZE]);

    const getValidTargets = useCallback((attacker: Unit, currentGrid: TileData[][], allUnits: Unit[]) => {
        const targets: Position[] = [];
        allUnits.forEach(target => {
            if (target.team === attacker.team) return;
            const dist = Math.abs(attacker.position.x - target.position.x) + Math.abs(attacker.position.y - target.position.y);
            if (dist <= attacker.attackRange) {
                if (hasLineOfSight(attacker.position, target.position, currentGrid)) {
                    targets.push(target.position);
                }
            }
        });
        return targets;
    }, [hasLineOfSight]);

    const getAttackRangePositions = useCallback((unit: Unit, currentGrid: TileData[][]) => {
        const positions: Position[] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const dist = Math.abs(unit.position.x - x) + Math.abs(unit.position.y - y);
                if (dist <= unit.attackRange && dist > 0) {
                    if (hasLineOfSight(unit.position, { x, y }, currentGrid)) {
                        positions.push({ x, y });
                    }
                }
            }
        }
        return positions;
    }, [hasLineOfSight, GRID_SIZE]);

    // --- Combat Logic ---
    const executeAttack = (attacker: Unit, target: Unit) => {
        // Play sword slash sound
        playSound('sword');

        // Apply damage immediately for responsive gameplay
        const dmg = attacker.damage;
        const eventId = Date.now();
        setDamageEvents(prev => [...prev, { x: target.position.x, y: target.position.y, amount: dmg, id: eventId }]);

        // Update enemy HP immediately
        setUnits(prev => prev.map(u => u.id === target.id ? { ...u, hp: u.hp - dmg } : u).filter(u => u.hp > 0));

        // Calculate sword position for visual animation (starts at hero)
        const swordPos = calculateSwordPosition(attacker.position, target.position);
        setSwordPosition(swordPos);

        // Animate the target being hit
        setAnimatingUnitId(target.id);
        setAnimationType('slash');

        // Clear animation after 1.5 seconds (matching new CSS animation duration)
        setTimeout(() => {
            setSwordPosition(null);
            setAnimatingUnitId(null);
            setAnimationType(null);
            // Clear damage text after 1 second
            setTimeout(() => setDamageEvents(prev => prev.filter(e => e.id !== eventId)), 1000);
        }, 1500); // 1.5 seconds to match new CSS animation duration
    };

    // Helper function to calculate knockback path positions
    const getKnockbackPath = (start: Position, end: Position): Position[] => {
        const path: Position[] = [];
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);

        // For 2-tile knockback, return intermediate positions
        for (let i = 1; i <= 2; i++) {
            path.push({
                x: start.x + (dx * i),
                y: start.y + (dy * i)
            });
        }
        return path;
    };

    const calculateSwordPosition = (attacker: Position, target: Position): { x: number, y: number, angle: number, direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' } => {
        const direction = calculateAttackDirection(attacker, target);

        // Position sword at attacker's position with proper orientation
        // Start with sword pointing toward enemy for clear origin connection
        const swordX = attacker.x;
        const swordY = attacker.y;

        return { x: swordX, y: swordY, angle: 0, direction }; // Start at 0 degrees pointing toward enemy
    };

    const calculateShieldPosition = (attacker: Position, target: Position): { x: number, y: number, angle: number, direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' } => {
        const direction = calculateAttackDirection(attacker, target);

        // Position shield at attacker's position with proper orientation
        // Shield has shorter range than sword, so start closer to attacker
        const shieldX = attacker.x;
        const shieldY = attacker.y;

        return { x: shieldX, y: shieldY, angle: 0, direction }; // Start at 0 degrees pointing toward enemy
    };

    // Helper function to get the position before a collision point
    const getPositionBeforeCollision = (_start: Position, collisionPoint: Position, dx: number, dy: number): Position => {
        // Use the original knockback direction to find the position before collision
        return {
            x: collisionPoint.x - dx,
            y: collisionPoint.y - dy
        };
    };

    const executeShieldBash = (attacker: Unit, target: Unit) => {
        // Play shield bash sound
        playSound('bash');

        const dx = target.position.x - attacker.position.x;
        const dy = target.position.y - attacker.position.y;
        // 2-tile knockback instead of 1
        const pushPos: Position = { x: target.position.x + (dx * 2), y: target.position.y + (dy * 2) };

        // Calculate shield position for visual animation (starts at hero)
        const shieldPos = calculateShieldPosition(attacker.position, target.position);
        setShieldPosition(shieldPos);

        // Animate the attacker's shield bash
        setAnimatingUnitId(attacker.id);
        setAnimationType('bash');

        setTimeout(() => {
            setAnimatingUnitId(target.id);
            setAnimationType('knockback');

            // Handle everything in a single state update to avoid race conditions
            setUnits(prev => {
                const updatedUnits = [...prev];
                const targetIndex = updatedUnits.findIndex(u => u.id === target.id);
                const targetUnit = updatedUnits[targetIndex];

                // Check if target is already eliminated (shouldn't happen, but safety check)
                if (targetIndex === -1 || targetUnit.hp <= 0) {
                    return updatedUnits.filter(u => u.hp > 0);
                }

                // Check bounds first
                const isOutOfBounds = pushPos.x < 0 || pushPos.x >= GRID_SIZE || pushPos.y < 0 || pushPos.y >= GRID_SIZE;
                if (isOutOfBounds) {
                    updatedUnits.splice(targetIndex, 1);
                    return updatedUnits.filter(u => u.hp > 0);
                }

                // Use path-based collision detection
                const knockbackPath = getKnockbackPath(target.position, pushPos);
                console.log('Shield Bash Debug:', {
                    targetId: target.id,
                    targetPos: target.position,
                    pushPos: pushPos,
                    knockbackPath: knockbackPath,
                    units: updatedUnits.map(u => ({ id: u.id, pos: u.position }))
                });

                const collisionPoint = knockbackPath.find(pos => {
                    // Check for unit collision
                    const unitCollision = updatedUnits.some(u =>
                        u.id !== target.id && u.position.x === pos.x && u.position.y === pos.y
                    );

                    // Check for mountain terrain collision
                    const terrainCollision = level.mapSetup(pos.x, pos.y) === 'mountain';

                    const collision = unitCollision || terrainCollision;
                    if (collision) {
                        console.log('Collision detected at:', pos, 'unit:', unitCollision, 'terrain:', terrainCollision);
                    }
                    return collision;
                });

                if (collisionPoint) {
                    // Play collision sound effect
                    playSound('collision');

                    // Collision detected! Target stops at position before collision
                    const stopPosition = getPositionBeforeCollision(target.position, collisionPoint, dx, dy);

                    console.log('Collision handling:', {
                        collisionPoint: collisionPoint,
                        stopPosition: stopPosition,
                        targetHp: targetUnit.hp,
                        originalDx: dx,
                        originalDy: dy
                    });

                    // Check if collision was with mountain terrain
                    const isMountainCollision = level.mapSetup(collisionPoint.x, collisionPoint.y) === 'mountain';

                    if (isMountainCollision) {
                        console.log('Mountain collision detected - applying stun');
                        // Mountain collision: target takes damage, gets stunned, and stays on mountain
                        updatedUnits[targetIndex] = {
                            ...targetUnit,
                            hp: targetUnit.hp - 1,
                            position: collisionPoint, // Stop at the mountain tile
                            stunned: true
                        };
                        // Immediately switch to enemy turn since target got stunned
                        setCurrentTurn('enemy');
                    } else {
                        // Regular unit collision
                        // Find the unit that was hit
                        const hitUnitIndex = updatedUnits.findIndex(u =>
                            u.position.x === collisionPoint.x && u.position.y === collisionPoint.y && u.id !== target.id
                        );

                        if (hitUnitIndex !== -1) {
                            const hitUnit = updatedUnits[hitUnitIndex];

                            // SPECIAL CASE: If shieldbearer hits archer, archer dies instantly
                            if (target.emoji === '🛡️' && hitUnit.emoji === '🏹') {
                                console.log('Shieldbearer collision with archer - archer eliminated!');
                                // Shieldbearer continues to archer's position, archer is eliminated
                                updatedUnits[targetIndex] = {
                                    ...targetUnit,
                                    hp: targetUnit.hp - 1,
                                    position: hitUnit.position,
                                    stunned: true // Shieldbearer gets stunned from collision
                                };
                                // Remove the archer
                                updatedUnits.splice(hitUnitIndex, 1);
                                // Immediately switch to enemy turn since shieldbearer got stunned
                                setCurrentTurn('enemy');
                            } else if (hitUnit.emoji === '🛡️' && target.emoji === '🏹') {
                                console.log('Archer collision with shieldbearer - shieldbearer eliminated!');
                                // Archer continues to shieldbearer's position, shieldbearer is eliminated
                                updatedUnits[targetIndex] = {
                                    ...targetUnit,
                                    hp: targetUnit.hp - 1,
                                    position: hitUnit.position,
                                    stunned: true // Archer gets stunned from collision
                                };
                                // Remove the shieldbearer
                                updatedUnits.splice(hitUnitIndex, 1);
                                // Immediately switch to enemy turn since archer got stunned
                                setCurrentTurn('enemy');
                            } else {
                                // Normal unit collision - position swap
                                // Position swap: Target takes hit unit's position and gets stunned
                                // Hit unit gets knocked back 2 tiles from collision point and does NOT get stunned
                                const hitUnitKnockbackPos = {
                                    x: collisionPoint.x + (dx * 2),
                                    y: collisionPoint.y + (dy * 2)
                                };

                                // Check if hit unit would be eliminated by knockback
                                const isHitUnitOutOfBounds = hitUnitKnockbackPos.x < 0 || hitUnitKnockbackPos.x >= GRID_SIZE ||
                                    hitUnitKnockbackPos.y < 0 || hitUnitKnockbackPos.y >= GRID_SIZE;
                                const isHitUnitWater = !isHitUnitOutOfBounds && level.mapSetup(hitUnitKnockbackPos.x, hitUnitKnockbackPos.y) === 'water';

                                updatedUnits[targetIndex] = {
                                    ...targetUnit,
                                    hp: targetUnit.hp - 1,
                                    position: hitUnit.position,
                                    stunned: true
                                };

                                if (isHitUnitOutOfBounds || isHitUnitWater) {
                                    // Eliminate hit unit
                                    updatedUnits.splice(hitUnitIndex, 1);
                                    console.log('Hit unit eliminated by knockback');
                                } else {
                                    // Knock back hit unit 2 tiles, no stun
                                    updatedUnits[hitUnitIndex] = {
                                        ...hitUnit,
                                        hp: hitUnit.hp - 1,
                                        position: hitUnitKnockbackPos
                                        // No stunned property
                                    };
                                    console.log('Hit unit knocked back to:', hitUnitKnockbackPos);
                                }

                                console.log('Position swap collision:', {
                                    targetNewPos: hitUnit.position,
                                    hitUnitNewPos: isHitUnitOutOfBounds || isHitUnitWater ? 'eliminated' : hitUnitKnockbackPos,
                                    targetStunned: true,
                                    hitUnitStunned: false
                                });

                                // Immediately switch to enemy turn since Unit A got stunned
                                setCurrentTurn('enemy');
                            }
                        } else {
                            // No unit to hit, target just takes damage and stops at collision point
                            updatedUnits[targetIndex] = { ...targetUnit, hp: targetUnit.hp - 1, position: stopPosition };
                            console.log('No unit collision, target stops at:', stopPosition);
                        }
                    }
                } else {
                    // No collision - check terrain at final destination
                    const terrain = level.mapSetup(pushPos.x, pushPos.y);

                    if (terrain === 'water') {
                        console.log('No collision, eliminating target in water');
                        updatedUnits.splice(targetIndex, 1);
                    } else if (terrain === 'mountain') {
                        console.log('No collision, stunning target on mountain');
                        // Mountain stun: target takes damage, becomes stunned, and stays on mountain
                        updatedUnits[targetIndex] = {
                            ...targetUnit,
                            hp: targetUnit.hp - 1,
                            position: pushPos,
                            stunned: true
                        };
                        // Immediately switch to enemy turn since target got stunned
                        setCurrentTurn('enemy');
                    } else {
                        console.log('No collision, normal knockback');
                        // Normal knockback to full destination
                        updatedUnits[targetIndex] = { ...targetUnit, hp: targetUnit.hp - 1, position: pushPos };
                    }
                }

                console.log('Final units:', updatedUnits.map(u => ({ id: u.id, pos: u.position, hp: u.hp, stunned: u.stunned !== undefined ? u.stunned : 'undefined' })));
                return [...updatedUnits].filter(u => u.hp > 0);
            });

            setTimeout(() => {
                setShieldPosition(null);
                setAnimatingUnitId(null);
                setAnimationType(null);
            }, 400);
        }, 300);
    };

    // --- Enemy AI ---
    useEffect(() => {
        if (currentTurn === 'enemy' && gameState === 'playing') {
            const timer = setTimeout(() => {
                const enemies = units.filter(u => u.team === 'enemy');
                const player = units.find(u => u.team === 'player');
                if (enemies.length > 0 && player) {
                    let newUnits = [...units];
                    let playerHp = player.hp;
                    enemies.sort((a, b) => {
                        const distA = Math.abs(a.position.x - player.position.x) + Math.abs(a.position.y - player.position.y);
                        const distB = Math.abs(b.position.x - player.position.x) + Math.abs(b.position.y - player.position.y);
                        return distA - distB;
                    });
                    enemies.forEach(enemy => {
                        // Skip stunned enemies
                        if (enemy.stunned) return;

                        const distToPlayer = Math.abs(enemy.position.x - player.position.x) + Math.abs(enemy.position.y - player.position.y);
                        if (distToPlayer > enemy.attackRange || !hasLineOfSight(enemy.position, player.position, grid)) {
                            const moves = getValidMoves(enemy, grid);
                            let bestMove = enemy.position;
                            let minDistance = Infinity;
                            moves.forEach(pos => {
                                const isBlocked = newUnits.some(u => u.position.x === pos.x && u.position.y === pos.y && u.id !== enemy.id);
                                if (isBlocked) return;
                                const dist = Math.abs(pos.x - player.position.x) + Math.abs(pos.y - player.position.y);
                                const diff = Math.abs(dist - enemy.attackRange);
                                if (diff < minDistance) { minDistance = diff; bestMove = pos; }
                            });
                            newUnits = newUnits.map(u => u.id === enemy.id ? { ...u, position: bestMove } : u);
                        }
                    });
                    enemies.forEach(enemy => {
                        // Skip stunned enemies for attacks
                        if (enemy.stunned) return;

                        const updated = newUnits.find(u => u.id === enemy.id)!;
                        const dist = Math.abs(updated.position.x - player.position.x) + Math.abs(updated.position.y - player.position.y);
                        if (dist <= updated.attackRange && hasLineOfSight(updated.position, player.position, grid)) {
                            playerHp -= updated.damage;
                            const evtId = Date.now() + Math.random();
                            setDamageEvents(prev => [...prev, { x: player.position.x, y: player.position.y, amount: updated.damage, id: evtId }]);
                            setTimeout(() => setDamageEvents(prev => prev.filter(e => e.id !== evtId)), 1000);
                        }
                    });
                    setUnits(newUnits.map(u => u.team === 'player' ? { ...u, hp: playerHp } : u).filter(u => u.hp > 0));
                }
                setCurrentTurn('player');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentTurn, grid, units, getValidMoves, hasLineOfSight, gameState]);

    const handleTileClick = (tile: TileData) => {
        if (currentTurn !== 'player') return;
        const selectedUnit = units.find(u => u.id === selectedUnitId);

        if (selectedUnit && hasMoved) {
            const isTarget = validTargets.some(t => t.x === tile.position.x && t.y === tile.position.y);
            const targetUnit = tile.unit;

            if (isTarget && targetUnit && targetUnit.team === 'enemy') {
                if (selectedAction === 'shield-bash') {
                    executeShieldBash(selectedUnit, targetUnit);
                } else {
                    executeAttack(selectedUnit, targetUnit);
                }
                setTimeout(() => {
                    setHasMoved(false);
                    setValidTargets([]);
                    setSelectedUnitId(null);
                    // Keep shield-bash for Mountain Pass, otherwise reset to attack
                    setSelectedAction(level.id === 2 ? 'shield-bash' : 'attack');
                    setCurrentTurn('enemy');
                }, 800);
            }
            return;
        }

        if (selectedUnitId && !hasMoved) {
            const isValidMove = validMoves.some(m => m.x === tile.position.x && m.y === tile.position.y);
            if (isValidMove) {
                const newUnits = units.map(u => u.id === selectedUnitId ? { ...u, position: tile.position } : u);
                setUnits(newUnits);
                const movedUnit = newUnits.find(u => u.id === selectedUnitId)!;
                const targets = getValidTargets(movedUnit, grid, newUnits);
                setValidMoves([]);
                if (targets.length > 0) {
                    setHasMoved(true);
                    setValidTargets(targets);
                } else {
                    setSelectedUnitId(null);
                    setCurrentTurn('enemy');
                }
                return;
            }
        }

        if (tile.unit && !hasMoved && tile.unit.team === 'player') {
            // Don't allow selecting stunned units
            if (tile.unit.stunned) {
                setSelectedUnitId(null);
                setValidMoves([]);
                return;
            }
            setSelectedUnitId(tile.unit.id);
            setValidMoves(getValidMoves(tile.unit, grid));
        } else if (!hasMoved) {
            setSelectedUnitId(null);
            setValidMoves([]);
        }
    };

    const handleTileHover = (tile: TileData) => {
        // setHoveredTile(tile);

        // Handle hovering over enemy units
        if (tile.unit && tile.unit.team === 'enemy') {
            setHoveredEnemyUnit(tile.unit);
        } else {
            setHoveredEnemyUnit(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-800 p-8 relative">
            <button onClick={onExit} className="absolute top-4 left-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-500 transition-colors z-[60]">
                ← Exit to Overworld
            </button>
            <h1 className="text-3xl text-white font-bold mb-4">{level.name}</h1>

            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl border-2 border-slate-600 shadow-2xl text-center">
                        <h2 className={`text-5xl font-bold mb-4 ${gameState === 'won' ? 'text-yellow-400' : 'text-red-500'}`}>
                            {gameState === 'won' ? 'VICTORY' : 'DEFEAT'}
                        </h2>
                        <p className="text-slate-300 text-lg mb-6">
                            {gameState === 'won'
                                ? (isFinalLevel
                                    ? "Congratulations! You've completed all levels. Thanks for playing my first game ever."
                                    : "Purged. Next level unlocked!")
                                : "Fallen."
                            }
                        </p>
                        <div className="flex flex-col gap-4">
                            {gameState === 'won' && (
                                <button onClick={onWin} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg">
                                    Continue to Overworld
                                </button>
                            )}
                            <button onClick={onRetry} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg">
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTutorial && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-800 p-8 rounded-xl border-2 border-blue-500 shadow-2xl max-w-lg">
                        <h2 className="text-3xl font-bold text-blue-400 mb-2 tracking-widest uppercase border-b border-blue-500/30 pb-2">Mission Briefing</h2>
                        <p className="text-slate-300 mt-4 italic">{level.description}</p>
                        <button onClick={() => setShowTutorial(false)} className="w-full mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg animate-pulse">START</button>
                        <button onClick={onExit} className="w-full mt-3 px-6 py-2 bg-transparent hover:bg-slate-700 text-slate-400 text-sm rounded-lg border border-slate-600">← Back</button>
                    </div>
                </div>
            )}

            <div className={`mb-6 px-6 py-2 rounded-full font-bold text-xl tracking-wider shadow-lg transition-colors duration-300 ${currentTurn === 'player' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                {currentTurn === 'player' ? "PLAYER PHASE" : "ENEMY PHASE"}
            </div>

            {/* How to Play Modal */}
            {showHowToPlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-800 p-8 rounded-xl border-2 border-blue-500 shadow-2xl max-w-lg max-h-[80vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold text-blue-400 mb-6 tracking-widest uppercase border-b border-blue-500/30 pb-2">How to Play</h2>

                        <div className="space-y-6 text-slate-300">
                            {level.howToPlay.map((section, index) => (
                                <div key={index}>
                                    <h3 className="font-bold text-yellow-400 text-lg mb-2">{section.title}</h3>
                                    <p>{section.content}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowHowToPlay(false)}
                            className="w-full mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 p-4 rounded-lg shadow-xl border border-slate-700 relative">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }} onMouseLeave={() => { setHoveredEnemyUnit(null); }}>
                    {grid.map((row, y) => row.map((tile, x) => {
                        const isHoveredAttackRange = hoveredEnemyUnit && getAttackRangePositions(hoveredEnemyUnit, grid).some(pos => pos.x === x && pos.y === y);
                        const isStunned = tile.unit?.stunned || false;

                        return (
                            <Tile
                                key={`${x}-${y}`}
                                data={tile}
                                isSelected={selectedUnitId === tile.unit?.id}
                                isValidMove={validMoves.some(m => m.x === x && m.y === y)}
                                isTarget={validTargets.some(t => t.x === x && t.y === y)}
                                isAttackRange={isHoveredAttackRange ? true : undefined}
                                damageAmount={damageEvents.find(e => e.x === x && e.y === y)?.amount}
                                isAnimating={animatingUnitId === tile.unit?.id}
                                animationType={animationType}
                                isStunned={isStunned}
                                onClick={handleTileClick}
                                onHover={handleTileHover}
                            />
                        );
                    }))}
                </div>

                {/* Sword Slash Animation */}
                {swordPosition && (
                    <div
                        ref={(el) => {
                            if (el) {
                                Object.entries(getDirectionalProperties(swordPosition.direction)).forEach(([property, value]) => {
                                    el.style.setProperty(property, value);
                                });
                            }
                        }}
                        className="sword-slash-new"
                        style={{
                            left: `${swordPosition.x * 48 + 24}px`, // Center of tile (48px tile size + 24px offset)
                            top: `${swordPosition.y * 48 + 24}px`,
                            transform: `translate(-50%, -50%) rotate(${swordPosition.angle}deg)`,
                            animation: 'swordSlashNew 1.5s ease-out'
                        }}
                    />
                )}

                {/* Shield Bash Animation */}
                {shieldPosition && (
                    <div
                        ref={(el) => {
                            if (el) {
                                Object.entries(getDirectionalProperties(shieldPosition.direction)).forEach(([property, value]) => {
                                    el.style.setProperty(property, value);
                                });
                            }
                        }}
                        className="shield-bash-new"
                        style={{
                            left: `${shieldPosition.x * 48 + 24}px`, // Center of tile (48px tile size + 24px offset)
                            top: `${shieldPosition.y * 48 + 24}px`,
                            transform: `translate(-50%, -50%) rotate(${shieldPosition.angle}deg)`,
                            animation: 'shieldBashNew 1s ease-out'
                        }}
                    />
                )}
            </div>

            <div className="mt-6 w-full max-w-lg bg-slate-800 rounded-lg border border-slate-600 p-4 text-slate-200 flex justify-center items-center gap-4 shadow-lg min-h-[100px]">
                {selectedUnitId ? (
                    <div className="flex flex-col gap-4 items-center w-full">
                        <div>
                            <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2 justify-center">
                                {units.find(u => u.id === selectedUnitId)?.sprite ? <img src={units.find(u => u.id === selectedUnitId)?.sprite} alt="" className="w-8 h-8 object-contain pixelated" /> : units.find(u => u.id === selectedUnitId)?.emoji}
                                {units.find(u => u.id === selectedUnitId)?.name}
                            </h3>
                            <p className="text-sm mt-1 text-center">❤️ HP: {units.find(u => u.id === selectedUnitId)?.hp} / {units.find(u => u.id === selectedUnitId)?.maxHp}</p>
                        </div>

                        {/* Skill Bar */}
                        {hasMoved && (
                            <div className="flex gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 w-full">
                                {level.id !== 2 && (
                                    <button
                                        onClick={() => setSelectedAction('attack')}
                                        className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${selectedAction === 'attack' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                    >
                                        SWORD
                                    </button>
                                )}
                                {level.id !== 1 && (
                                    <button
                                        onClick={() => setSelectedAction('shield-bash')}
                                        className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${selectedAction === 'shield-bash' ? 'bg-orange-600 text-white ring-2 ring-orange-400' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                    >
                                        BASH 🛡️
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setShowHowToPlay(true)}
                        className="w-full max-w-xs px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        📖 How to Play
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameBoard;
