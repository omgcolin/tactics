import { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import Overworld from './components/Overworld';
import { LEVELS } from './data/levels';
import { musicManager } from './utils/musicManager';
import { getOverworldTrack, getTrackForLevel } from './utils/musicConfig';

// Game version for save compatibility
const GAME_VERSION = '1.2.0';

// Safe spawn distance from level entrances
const SAFE_SPAWN_DISTANCE = 5;

// Save/Load functions
const SAVE_KEY = 'tactics-game-save';
const VERSION_KEY = 'tactics-game-version';

// Helper function to calculate Manhattan distance
const calculateDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

// Helper function to check if position is safe from all level entrances
const isPositionSafe = (position: { x: number; y: number }, levels: typeof LEVELS) => {
  return levels.every(level => {
    const distance = calculateDistance(position, level.overworldPosition);
    return distance >= SAFE_SPAWN_DISTANCE;
  });
};

// Helper function to find a safe position near the current position
const findSafePosition = (currentPos: { x: number; y: number }, levels: typeof LEVELS) => {
  // Generate candidate positions in expanding radius
  const maxRadius = 10;

  for (let radius = 1; radius <= maxRadius; radius++) {
    // Generate positions in a square pattern around the current position
    const positions = [];

    // Top and bottom edges of the square
    for (let dx = -radius; dx <= radius; dx++) {
      positions.push({ x: currentPos.x + dx, y: currentPos.y - radius });
      positions.push({ x: currentPos.x + dx, y: currentPos.y + radius });
    }

    // Left and right edges of the square (excluding corners to avoid duplicates)
    for (let dy = -radius + 1; dy <= radius - 1; dy++) {
      positions.push({ x: currentPos.x - radius, y: currentPos.y + dy });
      positions.push({ x: currentPos.x + radius, y: currentPos.y + dy });
    }

    // Check each position
    for (const pos of positions) {
      if (isPositionSafe(pos, levels)) {
        return pos;
      }
    }
  }

  // If no safe position found, return a default position far from all levels
  return { x: 5, y: 5 };
};

// Save/Load functions
const saveGame = (data: {
  unlockedLevels: number[];
  overworldPos: { x: number; y: number };
  currentLevelId: number;
}) => {
  try {
    // Save version if not already saved
    if (!localStorage.getItem(VERSION_KEY)) {
      localStorage.setItem(VERSION_KEY, GAME_VERSION);
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    console.log('Game saved successfully');
  } catch (error) {
    console.error('Failed to save game:', error);
  }
};

const loadGame = () => {
  try {
    // Check version compatibility
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion && savedVersion !== GAME_VERSION) {
      console.log('Game version mismatch, clearing saved data');
      localStorage.removeItem(SAVE_KEY);
      localStorage.setItem(VERSION_KEY, GAME_VERSION);
      return null;
    }

    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      console.log('Game loaded successfully:', data);

      // Force reset if all levels are unlocked (likely from old save data)
      if (data.unlockedLevels && data.unlockedLevels.length >= 3) {
        console.log('Detected old save data with all levels unlocked, forcing reset');
        localStorage.removeItem(SAVE_KEY);
        localStorage.setItem(VERSION_KEY, GAME_VERSION);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Failed to load game:', error);
  }
  return null;
};

function App() {
  const [currentView, setCurrentView] = useState<'overworld' | 'game'>('overworld');
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [overworldPos, setOverworldPos] = useState({ x: 11, y: 20 });
  const [retryKey, setRetryKey] = useState(0);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showSafeSpawnNotification, setShowSafeSpawnNotification] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showMusicError, setShowMusicError] = useState(false);
  const [showAudioPopup, setShowAudioPopup] = useState(true);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3); // Default 30% volume

  // Load saved game state on component mount
  useEffect(() => {
    console.log('=== Loading Game State ===');
    console.log('Initial unlockedLevels:', [1]);

    const savedGame = loadGame();
    if (savedGame) {
      console.log('Saved game found, overriding initial state:', savedGame);
      setUnlockedLevels(savedGame.unlockedLevels);
      setCurrentLevelId(savedGame.currentLevelId);

      // Apply safe spawn system
      const loadedPos = savedGame.overworldPos;
      if (!isPositionSafe(loadedPos, LEVELS)) {
        const safePos = findSafePosition(loadedPos, LEVELS);
        setOverworldPos(safePos);
        setShowSafeSpawnNotification(true);
        // Update the saved position with the safe position
        saveGame({
          unlockedLevels: savedGame.unlockedLevels,
          overworldPos: safePos,
          currentLevelId: savedGame.currentLevelId
        });
        setTimeout(() => setShowSafeSpawnNotification(false), 3000);
      } else {
        setOverworldPos(loadedPos);
      }
    } else {
      console.log('No saved game found, using initial state');
    }

    // Load saved volume preference
    const savedVolume = localStorage.getItem('music-volume');
    if (savedVolume) {
      const volume = parseFloat(savedVolume);
      setMusicVolume(volume);
      musicManager.setVolume(volume);
    }
  }, []);

  // Handle audio permission choice
  const handleAudioChoice = useCallback((enableAudio: boolean) => {
    setMusicEnabled(enableAudio);
    setAudioPermissionGranted(true);
    setShowAudioPopup(false);

    if (enableAudio) {
      try {
        const overworldTrack = getOverworldTrack();
        musicManager.playTrack(overworldTrack).catch(error => {
          console.warn('Failed to start overworld music:', error);
          setShowMusicError(true);
          setTimeout(() => setShowMusicError(false), 3000);
        });
      } catch (error) {
        console.warn('Music initialization failed:', error);
      }
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setMusicVolume(newVolume);
    musicManager.setVolume(newVolume);
    localStorage.setItem('music-volume', newVolume.toString());

    // If volume is set above 0 and music is muted, un-mute it
    if (newVolume > 0 && !musicEnabled) {
      setMusicEnabled(true);
      try {
        const overworldTrack = getOverworldTrack();
        musicManager.playTrack(overworldTrack).catch(error => {
          console.warn('Failed to restart music:', error);
        });
      } catch (error) {
        console.warn('Music restart failed:', error);
      }
    }
  }, [musicEnabled]);

  // Initialize music when entering overworld (if audio is enabled)
  useEffect(() => {
    if (currentView === 'overworld' && musicEnabled && audioPermissionGranted) {
      try {
        const overworldTrack = getOverworldTrack();
        musicManager.playTrack(overworldTrack).catch(error => {
          console.warn('Failed to switch to overworld music:', error);
        });
      } catch (error) {
        console.warn('Music initialization failed:', error);
      }
    }
  }, [currentView, musicEnabled, audioPermissionGranted]);

  // Handle music when view changes
  useEffect(() => {
    if (currentView === 'overworld') {
      // Switch to overworld music
      if (musicEnabled) {
        const overworldTrack = getOverworldTrack();
        musicManager.playTrack(overworldTrack).catch(error => {
          console.warn('Failed to switch to overworld music:', error);
        });
      }
    } else {
      // Switch to level music
      if (musicEnabled) {
        const levelTrack = getTrackForLevel(currentLevelId);
        if (levelTrack) {
          musicManager.playTrack(levelTrack).catch(error => {
            console.warn('Failed to start level music:', error);
          });
        } else {
          // No specific track for this level, stop music
          musicManager.stop();
        }
      }
    }
  }, [currentView, currentLevelId, musicEnabled]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      musicManager.destroy();
    };
  }, []);

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setCurrentView('game');
    // Music is already initialized, just switch to level music
    if (musicEnabled) {
      const levelTrack = getTrackForLevel(levelId);
      if (levelTrack) {
        musicManager.playTrack(levelTrack).catch(error => {
          console.warn('Failed to start level music:', error);
        });
      }
    }
  };

  const handleWin = () => {
    const currentLevel = LEVELS.find(l => l.id === currentLevelId);
    if (currentLevel?.unlocksId && !unlockedLevels.includes(currentLevel.unlocksId)) {
      setUnlockedLevels(prev => {
        const newUnlocked = [...prev, currentLevel.unlocksId!];
        saveGame({ unlockedLevels: newUnlocked, overworldPos, currentLevelId });
        return newUnlocked;
      });
    }
    // Offset hero position so they don't re-enter immediately
    setOverworldPos(prev => {
      const newPos = { x: prev.x, y: prev.y + 1 };

      // Apply safe spawn system
      if (!isPositionSafe(newPos, LEVELS)) {
        const safePos = findSafePosition(newPos, LEVELS);
        saveGame({ unlockedLevels, overworldPos: safePos, currentLevelId });
        setShowSafeSpawnNotification(true);
        setTimeout(() => setShowSafeSpawnNotification(false), 3000);
        return safePos;
      } else {
        saveGame({ unlockedLevels, overworldPos: newPos, currentLevelId });
        return newPos;
      }
    });
    // Advance current level marker in overworld
    if (currentLevel?.unlocksId) {
      setCurrentLevelId(currentLevel.unlocksId);
    }
    setCurrentView('overworld');
  };

  const handleLose = () => {
    // Offset hero position so they don't re-enter immediately
    setOverworldPos(prev => {
      const newPos = { x: prev.x, y: prev.y + 1 };

      // Apply safe spawn system
      if (!isPositionSafe(newPos, LEVELS)) {
        const safePos = findSafePosition(newPos, LEVELS);
        saveGame({ unlockedLevels, overworldPos: safePos, currentLevelId });
        setShowSafeSpawnNotification(true);
        setTimeout(() => setShowSafeSpawnNotification(false), 3000);
        return safePos;
      } else {
        saveGame({ unlockedLevels, overworldPos: newPos, currentLevelId });
        return newPos;
      }
    });
    setCurrentView('overworld');
  };

  const handleRetry = () => {
    // Reset to the same level without going to overworld
    // Increment retry key to force GameBoard to re-mount and reset all state
    setRetryKey(prev => prev + 1);
    setCurrentView('game');
  };

  const handleExit = () => {
    // Offset hero position so they don't re-enter immediately
    setOverworldPos(prev => {
      const newPos = { x: prev.x, y: prev.y + 1 };

      // Apply safe spawn system
      if (!isPositionSafe(newPos, LEVELS)) {
        const safePos = findSafePosition(newPos, LEVELS);
        saveGame({ unlockedLevels, overworldPos: safePos, currentLevelId });
        setShowSafeSpawnNotification(true);
        setTimeout(() => setShowSafeSpawnNotification(false), 3000);
        return safePos;
      } else {
        saveGame({ unlockedLevels, overworldPos: newPos, currentLevelId });
        return newPos;
      }
    });
    setCurrentView('overworld');
  };

  const currentLevel = LEVELS.find(l => l.id === currentLevelId)!;

  return (
    <div className="App w-full min-h-screen bg-slate-900">
      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg border border-green-400 animate-pulse">
          Game Saved! 💾
        </div>
      )}

      {/* Safe Spawn Notification */}
      {showSafeSpawnNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border border-blue-400 animate-pulse">
          Safe Spawn Activated! 🛡️
        </div>
      )}

      {/* Music Error Notification */}
      {showMusicError && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg border border-red-400 animate-pulse">
          Music Error! 🎵
        </div>
      )}

      {/* Music Controls */}
      <div className="fixed top-4 right-4 z-50 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 flex flex-col items-start gap-2 min-w-[180px]">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => {
              const newMusicEnabled = !musicEnabled;
              setMusicEnabled(newMusicEnabled);

              if (newMusicEnabled) {
                // Restart overworld music when turning it back on
                const overworldTrack = getOverworldTrack();
                musicManager.playTrack(overworldTrack).catch(error => {
                  console.warn('Failed to restart music:', error);
                });
              } else {
                musicManager.stop();
              }
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${musicEnabled
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-400'
              }`}

          >
            {musicEnabled ? '🎵' : '🔇'}
          </button>
          <span className="text-white text-xs font-bold">
            {musicEnabled ? 'PLAYING' : 'STOPPED'}
          </span>
        </div>

        {/* Volume Slider - Always visible for now */}
        <div className="w-full flex flex-col gap-1 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={musicVolume * 100}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"

            />
            <span className="text-white text-xs w-10 text-right">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Audio Enable/Disable Popup */}
      {showAudioPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-3xl mb-4">🎵</div>
              <h2 className="text-xl font-bold text-white mb-2">Enable Audio?</h2>
              <p className="text-gray-300 mb-6">
                Would you like to enable background music and sound effects for a better gaming experience?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleAudioChoice(true)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Enable Audio
                </button>
                <button
                  onClick={() => handleAudioChoice(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Disable Audio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'overworld' ? (
        <Overworld
          levels={LEVELS}
          unlockedLevels={unlockedLevels}
          heroPos={overworldPos}
          onMove={(newPos) => {
            setOverworldPos(newPos);
            saveGame({ unlockedLevels, overworldPos: newPos, currentLevelId });
            setShowSaveNotification(true);
            setTimeout(() => setShowSaveNotification(false), 2000);
          }}
          onSelectLevel={handleSelectLevel}
          backgroundUrl="/overworld_map.png"
        />
      ) : (
        <GameBoard
          key={retryKey}
          level={currentLevel}
          onWin={handleWin}
          onLose={handleLose}
          onExit={handleExit}
          onRetry={handleRetry}
          isFinalLevel={currentLevelId === 3}
        />
      )}
    </div>
  );
}

export default App;
