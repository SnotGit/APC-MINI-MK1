const ButtonMapping = {
    
    // ===== BOUTONS CONTRÔLE (82-89) ===== //
    control: {
        82: {
            name: 'Play/Stop',
            midiNote: 82,
            normal: {
                action: 'play_stop',
                description: 'Play/Stop Transport',
                ledMode: 'toggle', // 'off', 'on', 'toggle', 'blink'
                ledColor: 1 // 0=off, 1=green, 3=red, 5=yellow
            },
            shift: {
                action: 'stop',
                description: 'Stop Transport',
                ledMode: 'momentary',
                ledColor: 3
            }
        },
        83: {
            name: 'Record',
            midiNote: 83,
            normal: {
                action: 'record',
                description: 'Session Record',
                ledMode: 'toggle',
                ledColor: 3
            },
            shift: {
                action: 'stop_all',
                description: 'Stop All Clips',
                ledMode: 'momentary',
                ledColor: 5
            }
        },
        84: {
            name: 'Metronome',
            midiNote: 84,
            normal: {
                action: 'metronome_toggle',
                description: 'Toggle Metronome',
                ledMode: 'toggle',
                ledColor: 5
            },
            shift: {
                action: 'tap_tempo',
                description: 'Tap Tempo',
                ledMode: 'blink',
                ledColor: 5
            }
        },
        85: {
            name: 'New Clip',
            midiNote: 85,
            normal: {
                action: 'new_clip_8bars',
                description: 'Create New 8-Bar Clip',
                ledMode: 'momentary',
                ledColor: 1
            },
            shift: {
                action: 'quantize_clip',
                description: 'Quantize Selected Clip',
                ledMode: 'momentary',
                ledColor: 1
            }
        },
        86: {
            name: 'Play Clip',
            midiNote: 86,
            normal: {
                action: 'play_clip_selected',
                description: 'Play Selected Clip',
                ledMode: 'momentary',
                ledColor: 1
            },
            shift: {
                action: 'stop_clip_selected',
                description: 'Stop Selected Clip',
                ledMode: 'momentary',
                ledColor: 3
            }
        },
        87: {
            name: 'Loop',
            midiNote: 87,
            normal: {
                action: 'loop_auto_record',
                description: 'Auto Loop Record',
                ledMode: 'toggle',
                ledColor: 3
            },
            shift: {
                action: 'overdub_loop',
                description: 'Overdub Loop',
                ledMode: 'toggle',
                ledColor: 5
            }
        },
        88: {
            name: 'Tempo',
            midiNote: 88,
            normal: {
                action: 'tempo_up_20',
                description: 'Tempo +20 BPM',
                ledMode: 'momentary',
                ledColor: 5
            },
            shift: {
                action: 'tempo_down_20',
                description: 'Tempo -20 BPM',
                ledMode: 'momentary',
                ledColor: 5
            }
        },
        89: {
            name: 'Scene',
            midiNote: 89,
            normal: {
                action: 'launch_scene_1',
                description: 'Launch Scene 1',
                ledMode: 'momentary',
                ledColor: 1
            },
            shift: {
                action: 'capture_midi',
                description: 'Capture MIDI',
                ledMode: 'momentary',
                ledColor: 3
            }
        }
    },

    // ===== SHIFT BUTTON (98) ===== //
    shift: {
        98: {
            name: 'Shift',
            midiNote: 98,
            action: 'shift_modifier',
            description: 'Shift Modifier',
            ledMode: 'toggle',
            ledColor: 5
        }
    },

    // ===== TRACK BUTTONS (64-71) ===== //
    tracks: {
        64: { name: 'Track 1', midiNote: 64, action: 'track_select_arm', description: 'Select/ARM Track 1' },
        65: { name: 'Track 2', midiNote: 65, action: 'track_select_arm', description: 'Select/ARM Track 2' },
        66: { name: 'Track 3', midiNote: 66, action: 'track_select_arm', description: 'Select/ARM Track 3' },
        67: { name: 'Track 4', midiNote: 67, action: 'track_select_arm', description: 'Select/ARM Track 4' },
        68: { name: 'Track 5', midiNote: 68, action: 'track_select_arm', description: 'Select/ARM Track 5' },
        69: { name: 'Track 6', midiNote: 69, action: 'track_select_arm', description: 'Select/ARM Track 6' },
        70: { name: 'Track 7', midiNote: 70, action: 'track_select_arm', description: 'Select/ARM Track 7' },
        71: { name: 'Track 8', midiNote: 71, action: 'track_select_arm', description: 'Select/ARM Track 8' }
    },

    // ===== FADERS (48-56) ===== //
    faders: {
        48: { name: 'Volume 1', midiCC: 48, action: 'track_volume', description: 'Track 1 Volume' },
        49: { name: 'Volume 2', midiCC: 49, action: 'track_volume', description: 'Track 2 Volume' },
        50: { name: 'Volume 3', midiCC: 50, action: 'track_volume', description: 'Track 3 Volume' },
        51: { name: 'Volume 4', midiCC: 51, action: 'track_volume', description: 'Track 4 Volume' },
        52: { name: 'Volume 5', midiCC: 52, action: 'track_volume', description: 'Track 5 Volume' },
        53: { name: 'Volume 6', midiCC: 53, action: 'track_volume', description: 'Track 6 Volume' },
        54: { name: 'Volume 7', midiCC: 54, action: 'track_volume', description: 'Track 7 Volume' },
        55: { name: 'Volume 8', midiCC: 55, action: 'track_volume', description: 'Track 8 Volume' },
        56: { name: 'Master', midiCC: 56, action: 'master_volume', description: 'Master Volume' }
    },

    // ===== PADS (0-63) ===== //
    pads: {
        // Configuration des pads gérée par pads.js et sequencer.js
        // Voir mapping spécifique dans ces modules
    },

    // ===== ACTIONS DISPONIBLES FUTURES ===== //
    // ===========================================
    // AJOUTEZ ICI VOS NOUVELLES ACTIONS :
    // 
    // availableActions: {
    //     transport: ['play', 'stop', 'pause', 'continue', 'record'],
    //     session: ['launch_scene_2', 'launch_scene_3', 'stop_all_clips'],
    //     device: ['device_on_off', 'device_lock', 'browse_devices'],
    //     tempo: ['tempo_up_1', 'tempo_down_1', 'sync_to_external'],
    //     loop: ['loop_start', 'loop_end', 'loop_double', 'loop_halve'],
    //     view: ['session_view', 'arrangement_view', 'detail_view'],
    //     selection: ['select_next_track', 'select_prev_track', 'select_next_scene']
    // }
    // ===========================================

    // ===== EXPORT CONFIGURATION ===== //
    getPythonConfig() {
        return {
            control_buttons: this.control,
            shift_button: this.shift,
            track_buttons: this.tracks,
            faders: this.faders,
            // Ajoutez d'autres sections si nécessaire
        };
    },

    // ===== UTILITAIRES ===== //
    getButtonByNote(midiNote) {
        // Recherche dans tous les mapping
        for (const [section, buttons] of Object.entries(this)) {
            if (typeof buttons === 'object' && buttons[midiNote]) {
                return buttons[midiNote];
            }
        }
        return null;
    },

    getControlButtonAction(buttonId, mode = 'normal') {
        const button = this.control[buttonId];
        return button ? button[mode] : null;
    },

    getAllControlButtons() {
        return Object.keys(this.control).map(id => parseInt(id));
    },

    getAllTrackButtons() {
        return Object.keys(this.tracks).map(id => parseInt(id));
    },

    getAllFaders() {
        return Object.keys(this.faders).map(id => parseInt(id));
    }
};