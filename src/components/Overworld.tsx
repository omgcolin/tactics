import React, { useEffect, useCallback } from 'react';
import type { LevelData } from '../data/levels';

interface OverworldProps {
    levels: LevelData[];
    unlockedLevels: number[];
    heroPos: { x: number; y: number };
    onMove: (pos: { x: number; y: number }) => void;
    onSelectLevel: (levelId: number) => void;
    backgroundUrl: string;
}

const WORLD_SIZE = 22; // 22x22 grid
const TILE_SIZE = 72; // pixels per tile (zoomed in 50%)

const Overworld: React.FC<OverworldProps> = ({
    levels,
    unlockedLevels,
    heroPos,
    onMove,
    onSelectLevel,
    backgroundUrl
}) => {
    // Movement Handler - only on fresh key press, not hold
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore repeated events from holding key down
        if (e.repeat) return;

        const next = { ...heroPos };
        if (e.key === 'ArrowUp' || e.key === 'w') next.y = Math.max(0, heroPos.y - 1);
        else if (e.key === 'ArrowDown' || e.key === 's') next.y = Math.min(WORLD_SIZE - 1, heroPos.y + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'a') next.x = Math.max(0, heroPos.x - 1);
        else if (e.key === 'ArrowRight' || e.key === 'd') next.x = Math.min(WORLD_SIZE - 1, heroPos.x + 1);
        else return;

        onMove(next);
    }, [heroPos, onMove]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Check for level entry
    useEffect(() => {
        const levelAtPos = levels.find(l =>
            l.overworldPosition.x === heroPos.x &&
            l.overworldPosition.y === heroPos.y &&
            unlockedLevels.includes(l.id)
        );

        if (levelAtPos) {
            // Optional: Auto-enter or wait for a key? 
            // User said "entering... leads to the level", so let's do auto-enter with a slight delay
            const timer = setTimeout(() => {
                onSelectLevel(levelAtPos.id);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [heroPos, levels, unlockedLevels, onSelectLevel]);

    return (
        <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex items-center justify-center">
            {/* World Container - Centered on Hero (Simple Camera) */}
            <div
                className="relative transition-transform duration-100 ease-out"
                style={{
                    width: WORLD_SIZE * TILE_SIZE,
                    height: WORLD_SIZE * TILE_SIZE,
                    backgroundImage: `url(${backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transform: `translate(${(WORLD_SIZE / 2 - heroPos.x) * TILE_SIZE}px, ${(WORLD_SIZE / 2 - heroPos.y) * TILE_SIZE}px)`
                }}
            >
                {/* Visual Grid / Map Art (Optional overlay) */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px` }}></div>

                {/* Level Entrances (Thick Forest Portals) */}
                {levels.map(level => {
                    const isUnlocked = unlockedLevels.includes(level.id);
                    return (
                        <div
                            key={level.id}
                            className={`absolute flex items-center justify-center transition-opacity duration-1000 ${isUnlocked ? 'opacity-100' : 'opacity-20'}`}
                            style={{
                                left: level.overworldPosition.x * TILE_SIZE,
                                top: level.overworldPosition.y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE
                            }}
                        >
                            {/* The Level Entrance - VERY VISIBLE */}
                            <div className="relative group">
                                {/* Outer pulsing ring */}
                                <div className="absolute inset-0 w-20 h-20 -translate-x-1/4 -translate-y-1/4 bg-yellow-400/30 rounded-full animate-ping"></div>

                                {/* Main entrance marker */}
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_30px_rgba(255,200,0,0.8),0_0_60px_rgba(255,150,0,0.5)]">
                                    <span className="text-3xl">⚔️</span>
                                </div>

                                {/* Always visible label */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-black/90 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap border border-yellow-500/50 shadow-lg">
                                    {isUnlocked ? level.name : '🔒 Locked'}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Hero Knight */}
                <div
                    className="absolute z-10 transition-all duration-100 ease-linear"
                    style={{
                        left: heroPos.x * TILE_SIZE,
                        top: heroPos.y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src="/knight_transparent.png"
                            alt="Hero"
                            className="w-[72px] h-[72px] object-contain pixelated drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        />
                        {/* Shadow underneath */}
                        <div className="absolute bottom-1 w-8 h-2 bg-black/30 rounded-full blur-[2px]"></div>
                    </div>
                </div>
            </div>

            {/* HUD / Instructions */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white text-sm font-bold tracking-widest uppercase flex items-center gap-4">
                <div className="flex gap-2">
                    <span className="bg-white/10 px-2 rounded">WASD</span>
                    <span>or</span>
                    <span className="bg-white/10 px-2 rounded">↑←↓→</span>
                    <span>to Move</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div>Explore the Forest</div>
            </div>


        </div>
    );
};

export default Overworld;
