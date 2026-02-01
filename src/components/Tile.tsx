import React from 'react';
import type { TileData } from '../types/game';

interface TileProps {
    data: TileData;
    isSelected?: boolean;
    isValidMove?: boolean;
    isTarget?: boolean;
    isAttackRange?: boolean;
    damageAmount?: number | null; // For floating test
    isAnimating?: boolean;
    animationType?: 'lunge' | 'knockback' | 'slash' | 'bash' | null;
    isStunned?: boolean;
    onClick: (data: TileData) => void;
    onHover: (data: TileData) => void;
}

const Tile: React.FC<TileProps> = ({
    data, isSelected, isValidMove, isTarget, isAttackRange,
    damageAmount, isAnimating, animationType, isStunned, onClick, onHover
}) => {
    // Only Forests and Mountains get Emojis now
    const getTerrainEmoji = () => {
        switch (data.terrain) {
            case 'forest': return '🌲';
            case 'mountain': return '⛰️';
            default: return '';
        }
    };

    // Strong colors for everything
    const getBackgroundClass = () => {
        switch (data.terrain) {
            case 'water': return 'bg-blue-400';
            case 'mountain': return 'bg-stone-500';
            case 'forest': return 'bg-green-600';
            case 'plains': return 'bg-green-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div
            className={`
        w-12 h-12 
        relative
        border
        flex items-center justify-center 
        cursor-pointer 
        transition-all duration-200
        hover:border-2 hover:border-yellow-400 hover:z-10 hover:shadow-lg
        ${isSelected ? 'border-4 border-yellow-400 z-20 shadow-xl' : 'border-gray-300/50'}
        ${getBackgroundClass()}
      `}
            onClick={() => onClick(data)}
            onMouseEnter={() => onHover(data)}
            title=""
        >
            {/* Valid Move Overlay */}
            {isValidMove && !data.unit && (
                <div className="absolute inset-0 bg-blue-500/30 border-2 border-blue-400 z-10 animate-pulse pointer-events-none" />
            )}

            {/* Attack Target Overlay */}
            {isTarget && (
                <div className="absolute inset-0 bg-red-500/40 border-2 border-red-600 z-10 animate-pulse pointer-events-none" />
            )}

            {/* Hover Attack Range Overlay */}
            {isAttackRange && !isTarget && (
                <div className="absolute inset-0 bg-red-600/40 border border-red-700/60 z-0 pointer-events-none" />
            )}

            {/* Damage Floating Text */}
            {damageAmount !== null && damageAmount !== undefined && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                    <span className="text-red-500 font-bold text-3xl animate-bounce drop-shadow-md stroke-white">
                        -{damageAmount}
                    </span>
                </div>
            )}

            <span className="text-2xl select-none filter drop-shadow-md">
                {getTerrainEmoji()}
            </span>

            {/* Unit Layer */}
            {data.unit && (
                <div className={`
                    absolute inset-0 flex items-center justify-center pointer-events-none z-10
                    ${isAnimating && animationType === 'lunge' ? 'animate-lunge' : ''}
                    ${isAnimating && animationType === 'knockback' ? 'animate-knockback' : ''}
                    ${isAnimating && animationType === 'slash' ? 'animate-slash' : ''}
                    ${isAnimating && animationType === 'bash' ? 'animate-bash' : ''}
                    ${isStunned ? 'animate-pulse' : ''}
                `}>
                    {data.unit.sprite ? (
                        <img
                            src={data.unit.sprite}
                            alt={data.unit.name}
                            className="object-contain pixelated pointer-events-none"
                            style={{
                                width: `${(data.unit.sizeMultiplier || 1) * 40}px`,
                                height: `${(data.unit.sizeMultiplier || 1) * 40}px`,
                                maxWidth: 'none' // Allow it to spill over tiles
                            }}
                        />
                    ) : (
                        <span className="text-3xl filter drop-shadow-lg transform transition-transform hover:scale-110">
                            {data.unit.emoji}
                        </span>
                    )}
                    {/* Team Indicator (Small dot) */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white
             ${data.unit.team === 'player' ? 'bg-blue-500' : 'bg-purple-600'}`}
                    />
                    {/* Stun Effect */}
                    {isStunned && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="w-8 h-8 border-4 border-yellow-400 rounded-full animate-ping opacity-75" />
                            <div className="absolute text-yellow-400 text-xl font-bold">⚡</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Tile;
