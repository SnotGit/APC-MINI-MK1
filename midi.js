// midi.js - Gestion de la connexion MIDI

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
            App.log('Web MIDI API non supportée dans ce navigateur', 'error');
            return false;
        }
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
                    App.log(`Input trouvé: ${input.name}`, 'info');
                    break;
                }
            }
            
            // Output
            for (const output of this.access.outputs.values()) {
                if (output.name.toLowerCase().includes('apc') || 
                    output.name.toLowerCase().includes('mini')) {
                    this.output = output;
                    foundOutput = true;
                    App.log(`Output trouvé: ${output.name}`, 'info');
                    break;
                }
            }
            
            if (foundInput && foundOutput) {
                App.log('APC Mini connecté avec succès', 'info');
                
                // Initialiser les LEDs
                this.clearAll();
                
                return true;
            } else {
                App.log('APC Mini non trouvé', 'error');
                return false;
            }
            
        } catch (error) {
            App.log(`Erreur de connexion: ${error.message}`, 'error');
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
        App.log('APC Mini déconnecté', 'info');
    },
    
    // Gestion des messages MIDI entrants
    handleMIDIMessage(event) {
        const [status, note, velocity] = event.data;
        
        // Note On
        if (status === 0x90 && velocity > 0) {
            if (note >= 0 && note <= 63) {
                // Pad pressé
                App.log(`Pad ${note} pressé`, 'info');
                Pads.handlePadPress(note);
            } else if (note >= 64 && note <= 71) {
                // Track button
                App.log(`Track ${note - 63} sélectionnée`, 'info');
            } else if (note >= 82 && note <= 89) {
                // Control button
                App.log(`Bouton ${note} pressé`, 'info');
            }
        }
        
        // Note Off
        else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
            if (note >= 0 && note <= 63) {
                App.log(`Pad ${note} relâché`, 'info');
            }
        }
    },
    
    // Envoyer une couleur à un pad
    setPadColor(padNumber, color) {
        if (!this.output) return;
        
        const colorValue = typeof color === 'string' ? this.COLORS[color] : color;
        this.output.send([0x90, padNumber, colorValue]);
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
            this.output.send([0x90, i, 0]);
        }
        
        App.log('Toutes les LEDs éteintes', 'info');
    },
    
    // Pattern de test
    testPattern() {
        if (!this.output) return;
        
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
            App.log('Test terminé', 'info');
        }, 3000);
    },
    
    // Utilitaires
    noteToRowCol(note) {
        // Convertir numéro de note MIDI en position grille
        const row = 7 - Math.floor(note / 8);
        const col = note % 8;
        return { row, col };
    },
    
    rowColToNote(row, col) {
        // Convertir position grille en numéro de note MIDI
        return (7 - row) * 8 + col;
    }
};