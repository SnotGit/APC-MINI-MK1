// midi.js - Gestion de la connexion MIDI (VERSION CORRIGÉE)

const MIDI = {
    access: null,
    input: null,
    output: null,
    
    // Constantes APC Mini
    COLORS: {
        OFF: 0,
        GREEN: 1,
        GREEN_BLINK: 2,
        RED: 3,
        RED_BLINK: 4,
        YELLOW: 5,
        YELLOW_BLINK: 6
    },
    
    // Initialisation
    init() {
        // Vérifier la disponibilité de Web MIDI
        if (!navigator.requestMIDIAccess) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('Web MIDI API non supportée dans ce navigateur', 'error');
            }
            return false;
        }
        
        console.log('Module MIDI initialisé');
        return true;
    },
    
    // Connexion à l'APC Mini
    async connect() {
        try {
            // Demander l'accès MIDI
            this.access = await navigator.requestMIDIAccess();
            
            // Chercher l'APC Mini
            let foundInput = false;
            let foundOutput = false;
            
            // Input
            for (const input of this.access.inputs.values()) {
                if (input.name.toLowerCase().includes('apc') || 
                    input.name.toLowerCase().includes('mini')) {
                    this.input = input;
                    this.input.onmidimessage = this.handleMIDIMessage.bind(this);
                    foundInput = true;
                    if (typeof App !== 'undefined' && App.log) {
                        App.log(`Input trouvé: ${input.name}`, 'info');
                    }
                    break;
                }
            }
            
            // Output
            for (const output of this.access.outputs.values()) {
                if (output.name.toLowerCase().includes('apc') || 
                    output.name.toLowerCase().includes('mini')) {
                    this.output = output;
                    foundOutput = true;
                    if (typeof App !== 'undefined' && App.log) {
                        App.log(`Output trouvé: ${output.name}`, 'info');
                    }
                    break;
                }
            }
            
            if (foundInput && foundOutput) {
                if (typeof App !== 'undefined' && App.log) {
                    App.log('APC Mini connecté avec succès', 'info');
                }
                
                // Initialiser les LEDs
                this.clearAll();
                
                return true;
            } else {
                if (typeof App !== 'undefined' && App.log) {
                    App.log('APC Mini non trouvé', 'error');
                }
                return false;
            }
            
        } catch (error) {
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Erreur de connexion: ${error.message}`, 'error');
            }
            return false;
        }
    },
    
    // Déconnexion
    disconnect() {
        if (this.input) {
            this.input.onmidimessage = null;
            this.input = null;
        }
        this.output = null;
        this.access = null;
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('APC Mini déconnecté', 'info');
        }
    },
    
    // Gestion des messages MIDI entrants
    handleMIDIMessage(event) {
        const [status, note, velocity] = event.data;
        
        // Note On
        if (status === 0x90 && velocity > 0) {
            if (note >= 0 && note <= 63) {
                // Pad pressé
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Pad ${note} pressé`, 'info');
                }
                
                // Notifier le module Pads
                if (typeof Pads !== 'undefined' && Pads.handlePadPress) {
                    Pads.handlePadPress(note);
                }
            } else if (note >= 64 && note <= 71) {
                // Track button
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Track ${note - 63} sélectionnée`, 'info');
                }
            } else if (note >= 82 && note <= 89) {
                // Control button
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Bouton ${note} pressé`, 'info');
                }
                
                // Notifier le module Buttons si c'est le bouton Shift
                if (note === 89 && typeof Buttons !== 'undefined' && Buttons.toggleShiftMode) {
                    Buttons.toggleShiftMode();
                }
            }
        }
        
        // Note Off
        else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
            if (note >= 0 && note <= 63) {
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Pad ${note} relâché`, 'info');
                }
            }
        }
    },
    
    // Envoyer une couleur à un pad
    setPadColor(padNumber, color) {
        if (!this.output) {
            console.warn('MIDI output non disponible');
            return;
        }
        
        let colorValue;
        
        // Gérer les différents types de couleur
        if (typeof color === 'string') {
            colorValue = this.COLORS[color.toUpperCase()] || this.COLORS.OFF;
        } else {
            colorValue = color;
        }
        
        // Envoyer le message MIDI
        try {
            this.output.send([0x90, padNumber, colorValue]);
            console.log(`Pad ${padNumber} → couleur ${color} (${colorValue})`);
        } catch (error) {
            console.error('Erreur envoi MIDI:', error);
        }
    },
    
    // ✅ NOUVELLE FONCTION : Alias pour setPadColor (compatibilité)
    sendNoteColor(note, color) {
        this.setPadColor(note, color);
    },
    
    // Éteindre tous les pads
    clearAll() {
        if (!this.output) return;
        
        // Éteindre tous les pads (0-63)
        for (let i = 0; i < 64; i++) {
            this.setPadColor(i, 'OFF');
        }
        
        // Éteindre les boutons de track (64-71)
        for (let i = 64; i <= 71; i++) {
            try {
                this.output.send([0x90, i, 0]);
            } catch (error) {
                console.error('Erreur clearAll:', error);
            }
        }
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('Toutes les LEDs éteintes', 'info');
        }
    },
    
    // Pattern de test
    testPattern() {
        if (!this.output) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('APC Mini non connecté', 'warning');
            }
            return;
        }
        
        const colors = ['GREEN', 'RED', 'YELLOW'];
        let colorIndex = 0;
        
        // Animation des pads
        for (let i = 0; i < 64; i++) {
            setTimeout(() => {
                this.setPadColor(i, colors[colorIndex % 3]);
                colorIndex++;
            }, i * 30);
        }
        
        // Éteindre après 3 secondes
        setTimeout(() => {
            this.clearAll();
            if (typeof App !== 'undefined' && App.log) {
                App.log('Test terminé', 'info');
            }
        }, 3000);
    },
    
    // ✅ FONCTIONS DE CONVERSION AJOUTÉES
    
    // Convertir numéro de note MIDI en position grille (row, col)
    noteToRowCol(note) {
        const row = 7 - Math.floor(note / 8);
        const col = note % 8;
        return { row, col };
    },
    
    // Convertir position grille en numéro de note MIDI
    rowColToNote(row, col) {
        return (7 - row) * 8 + col;
    },
    
    // ✅ NOUVELLE FONCTION : Convertir note MIDI vers index de pad
    noteToPadIndex(note) {
        const { row, col } = this.noteToRowCol(note);
        return row * 8 + col;
    },
    
    // ✅ NOUVELLE FONCTION : Convertir index de pad vers note MIDI
    padIndexToNote(padIndex) {
        const row = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        return this.rowColToNote(row, col);
    },
    
    // ✅ NOUVELLE FONCTION : Vérifier l'état de connexion
    isConnected() {
        return this.input !== null && this.output !== null;
    },
    
    // ✅ NOUVELLE FONCTION : Envoyer un message MIDI custom
    sendMIDI(status, data1, data2 = 0) {
        if (!this.output) {
            console.warn('MIDI output non disponible');
            return false;
        }
        
        try {
            this.output.send([status, data1, data2]);
            return true;
        } catch (error) {
            console.error('Erreur envoi MIDI custom:', error);
            return false;
        }
    },
    
    // ✅ NOUVELLE FONCTION : Contrôler les LEDs des boutons de track
    setTrackLED(trackNumber, on = true) {
        if (trackNumber >= 1 && trackNumber <= 8) {
            const note = 63 + trackNumber; // Notes 64-71
            const velocity = on ? 127 : 0;
            this.sendMIDI(0x90, note, velocity);
        }
    },
    
    // ✅ NOUVELLE FONCTION : Test rapide de connexion
    quickTest() {
        if (!this.isConnected()) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('APC Mini non connecté', 'warning');
            }
            return false;
        }
        
        // Test rapide: allumer le premier pad en vert pendant 1 seconde
        this.setPadColor(0, 'GREEN');
        setTimeout(() => {
            this.setPadColor(0, 'OFF');
        }, 1000);
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('Test de connexion effectué', 'info');
        }
        
        return true;
    },
    
    // ✅ NOUVELLE FONCTION : Synchroniser l'état avec les modules
    syncWithModules() {
        // Synchroniser les pads
        if (typeof Pads !== 'undefined' && Pads.padConfigs) {
            for (let i = 0; i < 64; i++) {
                const config = Pads.padConfigs[i];
                if (config && config.active && config.color) {
                    this.setPadColor(config.note, config.color);
                }
            }
        }
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('État synchronisé avec les modules', 'info');
        }
    },
    
    // ✅ NOUVELLE FONCTION : Mode debug pour voir tous les messages MIDI
    enableDebug() {
        if (this.input) {
            this.input.onmidimessage = (event) => {
                console.log('MIDI reçu:', event.data);
                this.handleMIDIMessage(event);
            };
            
            if (typeof App !== 'undefined' && App.log) {
                App.log('Mode debug MIDI activé', 'info');
            }
        }
    },
    
    // Obtenir les informations de l'appareil connecté
    getDeviceInfo() {
        if (!this.isConnected()) {
            return null;
        }
        
        return {
            input: {
                name: this.input.name,
                manufacturer: this.input.manufacturer,
                id: this.input.id
            },
            output: {
                name: this.output.name,
                manufacturer: this.output.manufacturer,
                id: this.output.id
            }
        };
    }
};