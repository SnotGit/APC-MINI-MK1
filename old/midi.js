// midi.js - Version épurée (120 lignes vs 800+)

const MIDI = {
    access: null,
    input: null,
    output: null,
    
    // Spécifications APC Mini MK1
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
    async connect() {
        if (!navigator.requestMIDIAccess) {
            App.log('Web MIDI non supporté dans ce navigateur', 'error');
            return false;
        }
        
        try {
            this.access = await navigator.requestMIDIAccess();
            
            // Chercher APC Mini MK1
            let foundInput = false, foundOutput = false;
            
            for (const input of this.access.inputs.values()) {
                if (this.isApcMiniMK1(input.name)) {
                    this.input = input;
                    this.input.onmidimessage = this.handleMessage.bind(this);
                    foundInput = true;
                    break;
                }
            }
            
            for (const output of this.access.outputs.values()) {
                if (this.isApcMiniMK1(output.name)) {
                    this.output = output;
                    foundOutput = true;
                    break;
                }
            }
            
            if (foundInput && foundOutput) {
                this.clearAll();
                App.log('APC Mini MK1 connecté', 'success');
                return true;
            } else {
                App.log('APC Mini MK1 non trouvé', 'error');
                return false;
            }
            
        } catch (error) {
            App.log(`Erreur connexion MIDI: ${error.message}`, 'error');
            return false;
        }
    },
    
    // Vérifier si c'est un APC Mini MK1 (pas MK2)
    isApcMiniMK1(name) {
        const n = name.toLowerCase();
        return n.includes('apc') && n.includes('mini') && !n.includes('mk2') && !n.includes('mk ii');
    },
    
    // Gestion des messages MIDI entrants
    handleMessage(event) {
        const [status, note, velocity] = event.data;
        
        // Note On (velocity > 0)
        if (status === 0x90 && velocity > 0) {
            // Pads (0-63)
            if (note >= 0 && note <= 63) {
                App.log(`Pad ${note + 1} pressé`, 'info');
                if (typeof Pads !== 'undefined') {
                    Pads.handlePadPress(note);
                }
            }
            // Boutons track (64-71)
            else if (note >= 64 && note <= 71) {
                App.log(`Track ${note - 63} sélectionnée`, 'info');
            }
            // Boutons contrôle (82-89, 98)
            else if ((note >= 82 && note <= 89) || note === 98) {
                App.log(`Bouton contrôle ${note} pressé`, 'info');
                if (note === 98) {
                    App.log('Mode Shift activé', 'info');
                }
            }
        }
        // Control Change pour faders (48-56)
        else if (status === 0xB0 && note >= 48 && note <= 56) {
            App.log(`Fader ${note - 47}: ${velocity}`, 'info');
        }
    },
    
    // Envoyer couleur à un pad
    setPadColor(padNumber, color) {
        if (!this.output) return false;
        
        // Validation
        if (padNumber < 0 || padNumber > 63) {
            console.warn(`Pad invalide: ${padNumber}`);
            return false;
        }
        
        // Conversion couleur
        let colorValue = 0;
        if (typeof color === 'string') {
            colorValue = this.COLORS[color.toUpperCase()] || 0;
        } else if (typeof color === 'number') {
            colorValue = Math.max(0, Math.min(6, color));
        }
        
        try {
            this.output.send([0x90, padNumber, colorValue]);
            return true;
        } catch (error) {
            console.error('Erreur envoi MIDI:', error);
            return false;
        }
    },
    
    // Éteindre tous les pads
    clearAll() {
        if (!this.output) return;
        
        // Éteindre pads 0-63
        for (let i = 0; i < 64; i++) {
            this.output.send([0x90, i, 0]);
        }
        
        // Éteindre boutons track 64-71
        for (let i = 64; i <= 71; i++) {
            this.output.send([0x90, i, 0]);
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
    
    // État de connexion
    isConnected() {
        return this.input !== null && this.output !== null;
    }
};