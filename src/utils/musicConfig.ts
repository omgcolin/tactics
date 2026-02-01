import type { Track } from './musicManager';

// Music configuration - you can add your audio files here later
export const MUSIC_TRACKS: Record<string, Track> = {
    // Overworld track
    overworld: {
        id: 'overworld',
        name: 'Mystic Forest Exploration',
        url: '/audio/overworld-music.mp3', // Add your file here
        volume: 1.0
    },

    // Level tracks (10% lower volume)
    forestAmbush: {
        id: 'forestAmbush',
        name: 'Archer\'s Peril',
        url: '/audio/forest-ambush-music.mp3', // Add your file here
        volume: 0.9
    },

    mountainPass: {
        id: 'mountainPass',
        name: 'Shieldbreaker\'s Challenge',
        url: '/audio/mountain-pass-music.mp3', // Add your file here
        volume: 0.9
    },

    crossfire: {
        id: 'crossfire',
        name: 'Deadly Tactics',
        url: '/audio/crossfire-music.mp3', // Add your file here
        volume: 0.9
    }
};

// Get track for specific level
export function getTrackForLevel(levelId: number): Track | null {
    switch (levelId) {
        case 1: // Forest Ambush
            return MUSIC_TRACKS.forestAmbush;
        case 2: // Mountain Pass
            return MUSIC_TRACKS.mountainPass;
        case 3: // The Crossfire
            return MUSIC_TRACKS.crossfire;
        default:
            return null;
    }
}

// Get overworld track
export function getOverworldTrack(): Track {
    return MUSIC_TRACKS.overworld;
}

// Check if all tracks are loaded (for debugging)
export function checkTracksLoaded(): { [key: string]: boolean } {
    const result: { [key: string]: boolean } = {};

    Object.entries(MUSIC_TRACKS).forEach(([key]) => {
        // For now, we'll assume tracks aren't loaded until you add the files
        result[key] = false;
    });

    return result;
}