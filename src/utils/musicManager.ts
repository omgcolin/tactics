export interface Track {
    id: string;
    name: string;
    url: string;
    volume: number;
}

export class MusicManager {
    private audio: HTMLAudioElement | null = null;
    private currentTrack: Track | null = null;
    private isPlaying: boolean = false;
    private isMuted: boolean = false;
    private volume: number = 0.3; // 30% volume for music
    private fadeInterval: number | null = null;

    constructor() {
        // Initialize audio element
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = this.volume;

        // Handle audio events
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
        });

        this.audio.addEventListener('error', (error) => {
            console.error('Audio error:', error);
            this.isPlaying = false;
        });
    }

    // Load and play a track
    async playTrack(track: Track): Promise<void> {
        if (!this.audio) return;

        try {
            // Stop current track if playing
            if (this.isPlaying) {
                await this.stop();
            }

            // Load new track
            this.currentTrack = track;
            this.audio.src = track.url;
            this.audio.volume = this.isMuted ? 0 : this.volume * track.volume;

            // Wait for audio to be ready
            await new Promise<void>((resolve, reject) => {
                if (this.audio) {
                    this.audio!.oncanplaythrough = () => resolve();
                    this.audio!.onerror = () => reject(new Error('Audio load failed'));
                }
            });

            // Play with fade in
            await this.play();
            this.fadeIn(1000); // 1 second fade in

        } catch (error) {
            console.error('Failed to play track:', error);
            this.isPlaying = false;
        }
    }

    // Play current track
    async play(): Promise<void> {
        if (!this.audio || !this.currentTrack) return;

        try {
            await this.audio.play();
            this.isPlaying = true;
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.isPlaying = false;
        }
    }

    // Stop current track
    async stop(): Promise<void> {
        if (!this.audio) return;

        this.fadeOut(500, () => {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
            this.isPlaying = false;
        });
    }

    // Pause current track
    pause(): void {
        if (!this.audio) return;

        this.audio.pause();
        this.isPlaying = false;
    }

    // Resume current track
    resume(): void {
        if (!this.audio || !this.currentTrack) return;

        this.play();
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio && this.currentTrack) {
            this.audio.volume = this.isMuted ? 0 : this.volume * this.currentTrack.volume;
        }
    }

    // Get current volume
    getVolume(): number {
        return this.volume;
    }

    // Mute/unmute
    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.audio && this.currentTrack) {
            this.audio.volume = this.isMuted ? 0 : this.volume * this.currentTrack.volume;
        }
        return this.isMuted;
    }

    // Is muted
    isMutedState(): boolean {
        return this.isMuted;
    }

    // Fade in effect
    private fadeIn(duration: number): void {
        if (!this.audio) return;

        this.audio.volume = 0;
        const startTime = Date.now();
        const startVolume = 0;
        const targetVolume = this.isMuted ? 0 : this.volume * (this.currentTrack?.volume || 1);

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        this.fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.audio!.volume = startVolume + (targetVolume - startVolume) * progress;

            if (progress >= 1) {
                if (this.fadeInterval) {
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                }
            }
        }, 16); // ~60fps
    }

    // Fade out effect
    private fadeOut(duration: number, callback: () => void): void {
        if (!this.audio) {
            callback();
            return;
        }

        const startTime = Date.now();
        const startVolume = this.audio.volume;
        const targetVolume = 0;

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        this.fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.audio!.volume = startVolume + (targetVolume - startVolume) * progress;

            if (progress >= 1) {
                if (this.fadeInterval) {
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                }
                callback();
            }
        }, 16); // ~60fps
    }

    // Get current track
    getCurrentTrack(): Track | null {
        return this.currentTrack;
    }

    // Is playing
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    // Cleanup
    destroy(): void {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        this.currentTrack = null;
        this.isPlaying = false;
    }
}

// Create singleton instance
export const musicManager = new MusicManager();