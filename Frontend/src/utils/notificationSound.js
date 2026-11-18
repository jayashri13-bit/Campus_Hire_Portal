/**
 * Clean 2-Tone "Ding-Dong" Bell Notification Chime for Campus Placement Portal.
 * Uses native Web Audio API oscillators with automatic browser autoplay unlock listener.
 */

let sharedAudioCtx = null;

// Register interaction listener to resume AudioContext according to Browser Autoplay policy
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const unlockAudio = () => {
        try {
            if (!sharedAudioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    sharedAudioCtx = new AudioCtx();
                }
            }
            if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
                sharedAudioCtx.resume().catch(() => { });
            }
        } catch {
            // Ignore audio unlock errors
        }
    };

    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
        window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    });
}

/**
 * Plays a clean 2-tone notification bell sound.
 */
export const playNotificationAlert = async () => {
    // Avoid running audio inside unit test environments or server-side rendering
    if (typeof window === 'undefined' || (import.meta.env && import.meta.env.MODE === 'test')) {
        return;
    }

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        if (!sharedAudioCtx) {
            sharedAudioCtx = new AudioCtx();
        }

        if (sharedAudioCtx.state === 'suspended') {
            await sharedAudioCtx.resume();
        }

        const now = sharedAudioCtx.currentTime;

        // "Ding" - High bell tone (E5 note - 659.25 Hz)
        const osc1 = sharedAudioCtx.createOscillator();
        const gain1 = sharedAudioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(sharedAudioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // "Dong" - Warm low bell tone (C5 note - 523.25 Hz) starting 0.14s later
        const osc2 = sharedAudioCtx.createOscillator();
        const gain2 = sharedAudioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25, now + 0.14);
        gain2.gain.setValueAtTime(0.35, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14 + 0.6);
        osc2.connect(gain2);
        gain2.connect(sharedAudioCtx.destination);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.14 + 0.6);
    } catch (audioErr) {
        console.warn("Notification sound playback notice:", audioErr);
    }
};
