// midi.js - Gestion de la connexion MIDI (VERSION CORRIGÉE POUR APC MINI MK1)

const MIDI = {
    access: null,
    input: null,
    output: null,
    messageQueue: [],
    isProcessing: false,
    
    // Constantes APC Mini MK1 (spécifications exactes)
    APC_MINI_MK1: {
        // Pads : Notes 0-63 (mapping standard APC)
        PAD_NOTES: Array.from({length: 64}, (_, i) => i),
        
        // Faders : CC 48-56 (8 faders de track + master)
        FADER_CCS: [48, 49, 50, 51, 52, 53, 54, 55, 56],
        
        // Boutons track select : Notes 64-71
        TRACK_BUTTONS: [64, 65, 66, 67, 68, 69, 70, 71],
        
        // Boutons de contrôle : Notes 82-89 (82-88 programmables, 89 = Shift)
        CONTROL_BUTTONS: [82, 83, 84, 85, 86, 87, 88, 89],
        
        // Couleurs LED pour MK1 (tri-couleur uniquement)
        COLORS: {
            OFF: 0,
            GREEN: 1,
            GREEN_BLINK: 2,
            RED: 3,
            RED_BLINK: 4,
            YELLOW: 5,
            YELLOW_BLINK: 6
        }
    },
    
    // Initialisation
    init() {
        // Vérifier la disponibilité de Web MIDI
        if (!navigator.requestMIDIAccess) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('Web MIDI API non supportée dans ce navigateur', 'error');
                App.log('Utilisez Chrome, Edge ou Opera pour une compatibilité complète', 'warning');
            }
            return false;
        }
        
        return true;
    },
    
    // Connexion à l'APC Mini avec retry automatique
    async connect(retryCount = 0) {
        try {
            // Demander l'accès MIDI avec SysEx pour diagnostics avancés
            this.access = await navigator.requestMIDIAccess({ sysex: true });
            
            // Chercher l'APC Mini MK1
            let foundInput = false;
            let foundOutput = false;
            
            // Input - Recherche plus précise pour APC Mini MK1
            for (const input of this.access.inputs.values()) {
                if (this.isApcMiniMK1(input.name)) {
                    this.input = input;
                    this.input.onmidimessage = this.handleMIDIMessage.bind(this);
                    foundInput = true;
                    if (typeof App !== 'undefined' && App.log) {
                        App.log(`Input APC Mini MK1 trouvé: ${input.name}`, 'success');
                    }
                    break;
                }
            }
            
            // Output - Recherche correspondante
            for (const output of this.access.outputs.values()) {
                if (this.isApcMiniMK1(output.name)) {
                    this.output = output;
                    foundOutput = true;
                    if (typeof App !== 'undefined' && App.log) {
                        App.log(`Output APC Mini MK1 trouvé: ${output.name}`, 'success');
                    }
                    break;
                }
            }
            
            if (foundInput && foundOutput) {
                // Initialiser le contrôleur
                await this.initializeController();
                
                // Configurer les event listeners pour déconnexion
                this.setupDisconnectionHandling();
                
                if (typeof App !== 'undefined' && App.log) {
                    App.log('APC Mini MK1 connecté et initialisé avec succès', 'success');
                }
                
                return true;
            } else {
                if (retryCount < 2) {
                    if (typeof App !== 'undefined' && App.log) {
                        App.log(`Tentative ${retryCount + 1}/3 - Recherche APC Mini MK1...`, 'warning');
                    }
                    // Retry après 1 seconde
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.connect(retryCount + 1);
                } else {
                    if (typeof App !== 'undefined' && App.log) {
                        App.log('APC Mini MK1 non trouvé après 3 tentatives', 'error');
                        App.log('Vérifiez: 1) Câble USB, 2) Pilotes, 3) Autre logiciel utilisant le contrôleur', 'warning');
                    }
                    return false;
                }
            }
            
        } catch (error) {
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Erreur de connexion MIDI: ${error.message}`, 'error');
                if (error.name === 'SecurityError') {
                    App.log('Accès MIDI refusé par le navigateur. Vérifiez les permissions.', 'warning');
                }
            }
            return false;
        }
    },
    
    // Vérifier si c'est bien un APC Mini MK1 (pas MK2)
    isApcMiniMK1(deviceName) {
        const name = deviceName.toLowerCase();
        // APC Mini original (pas MK2)
        return (name.includes('apc') && name.includes('mini') && !name.includes('mk2') && !name.includes('mk ii'));
    },
    
    // Initialisation du contrôleur après connexion
    async initializeController() {
        // Éteindre toutes les LEDs d'abord
        this.clearAll();
        
        // Test rapide de fonctionnalité
        await this.quickConnectionTest();
        
        // Synchroniser avec les modules existants
        setTimeout(() => {
            this.syncWithModules();
        }, 500);
    },
    
    // Test de connexion rapide
    async quickConnectionTest() {
        if (!this.output) return;
        
        try {
            // Test pattern rapide sur les 4 premiers pads
            const testColors = ['GREEN', 'RED', 'YELLOW', 'OFF'];
            
            for (let i = 0; i < 4; i++) {
                this.setPadColor(i, testColors[i]);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Éteindre après test
            setTimeout(() => {
                for (let i = 0; i < 4; i++) {
                    this.setPadColor(i, 'OFF');
                }
            }, 500);
            
            // Test terminé silencieusement
        } catch (error) {
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Erreur test connexion: ${error.message}`, 'warning');
            }
        }
    },
    
    // Gestion de la déconnexion automatique
    setupDisconnectionHandling() {
        if (this.access) {
            this.access.onstatechange = (event) => {
                if (event.port.state === 'disconnected' && this.isApcMiniMK1(event.port.name)) {
                    if (typeof App !== 'undefined' && App.log) {
                        App.log('APC Mini MK1 déconnecté', 'warning');
                    }
                    this.handleDisconnection();
                }
            };
        }
    },
    
    // Gérer la déconnexion
    handleDisconnection() {
        this.input = null;
        this.output = null;
        
        // Mettre à jour l'interface
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.textContent = 'RECONNEXION';
            connectBtn.style.background = '#f39c12';
            connectBtn.style.borderColor = '#f39c12';
        }
        
        // Tentative de reconnexion automatique après 3 secondes
        setTimeout(() => {
            this.attemptReconnection();
        }, 3000);
    },
    
    // Tentative de reconnexion
    async attemptReconnection() {
        if (typeof App !== 'undefined' && App.log) {
            App.log('Tentative de reconnexion automatique...', 'info');
        }
        
        const success = await this.connect();
        if (success && typeof App !== 'undefined') {
            App.state.midiConnected = true;
            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                connectBtn.textContent = 'CONNECTÉ';
                connectBtn.style.background = '#2ecc71';
                connectBtn.style.borderColor = '#2ecc71';
            }
        }
    },
    
    // Déconnexion manuelle
    disconnect() {
        if (this.input) {
            this.input.onmidimessage = null;
            this.input = null;
        }
        this.output = null;
        this.access = null;
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('APC Mini MK1 déconnecté manuellement', 'info');
        }
    },
    
    // Gestion des messages MIDI entrants avec validation
    handleMIDIMessage(event) {
        const [status, note, velocity] = event.data;
        
        // Validation du message
        if (!this.isValidMIDIMessage(status, note, velocity)) {
            return;
        }
        
        // Note On (velocity > 0)
        if (status === 0x90 && velocity > 0) {
            this.handleNoteOn(note, velocity);
        }
        // Note Off (velocity = 0 ou status = 0x80)
        else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
            this.handleNoteOff(note);
        }
        // Control Change pour les faders
        else if (status === 0xB0) {
            this.handleControlChange(note, velocity);
        }
    },
    
    // Validation des messages MIDI
    isValidMIDIMessage(status, note, velocity) {
        return (
            status >= 0x80 && status <= 0xBF &&
            note >= 0 && note <= 127 &&
            velocity >= 0 && velocity <= 127
        );
    },
    
    // Gérer Note On
    handleNoteOn(note, velocity) {
        // Pads (0-63)
        if (note >= 0 && note <= 63) {
            this.handlePadPress(note, velocity);
        }
        // Track buttons (64-71)
        else if (note >= 64 && note <= 71) {
            this.handleTrackButton(note);
        }
        // Control buttons (82-89)
        else if (note >= 82 && note <= 89) {
            this.handleControlButton(note);
        }
    },
    
    // Gérer Note Off
    handleNoteOff(note) {
        if (note >= 0 && note <= 63) {
            // Feedback visuel pour les pads
            if (typeof Pads !== 'undefined') {
                const padNumber = Pads.midiNoteToPadNumber(note);
                const padElement = document.querySelector(`[data-pad-number="${padNumber}"]`);
                if (padElement) {
                    padElement.classList.add('midi-feedback');
                    setTimeout(() => {
                        padElement.classList.remove('midi-feedback');
                    }, 200);
                }
            }
        }
    },
    
    // Gérer Control Change (faders)
    handleControlChange(cc, value) {
        if (cc >= 48 && cc <= 56) {
            const faderIndex = cc - 48;
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Fader ${faderIndex + 1}: ${value}`, 'info');
            }
        }
    },
    
    // Gérer pression de pad
    handlePadPress(note, velocity) {
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Pad pressé - Note MIDI: ${note}, Vélocité: ${velocity}`, 'info');
        }
        
        // Notifier le module Pads
        if (typeof Pads !== 'undefined' && Pads.handlePadPress) {
            Pads.handlePadPress(note, velocity);
        }
    },
    
    // Gérer boutons de track
    handleTrackButton(note) {
        const trackIndex = note - 63;
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Track ${trackIndex} sélectionnée`, 'info');
        }
    },
    
    // Gérer boutons de contrôle
    handleControlButton(note) {
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Bouton de contrôle ${note} pressé`, 'info');
        }
        
        // Bouton Shift (89)
        if (note === 89 && typeof Buttons !== 'undefined' && Buttons.toggleShiftMode) {
            Buttons.toggleShiftMode();
        }
        
        // Autres boutons (82-88)
        if (note >= 82 && note <= 88 && typeof Buttons !== 'undefined' && Buttons.handleButtonPress) {
            Buttons.handleButtonPress(note);
        }
    },
    
    // Envoyer une couleur à un pad avec gestion d'erreurs
    setPadColor(padNumber, color) {
        if (!this.output) {
            console.warn('APC Mini MK1 non connecté');
            return false;
        }
        
        // Validation des paramètres
        if (padNumber < 0 || padNumber > 63) {
            console.warn(`Numéro de pad invalide: ${padNumber}`);
            return false;
        }
        
        let colorValue;
        
        // Gérer les différents types de couleur
        if (typeof color === 'string') {
            colorValue = this.APC_MINI_MK1.COLORS[color.toUpperCase()];
            if (colorValue === undefined) {
                console.warn(`Couleur inconnue: ${color}`);
                colorValue = this.APC_MINI_MK1.COLORS.OFF;
            }
        } else if (typeof color === 'number') {
            colorValue = Math.max(0, Math.min(6, color)); // Limiter 0-6 pour MK1
        } else {
            colorValue = this.APC_MINI_MK1.COLORS.OFF;
        }
        
        // Envoyer le message MIDI avec gestion d'erreurs
        try {
            this.output.send([0x90, padNumber, colorValue]);
            console.log(`Pad ${padNumber} → ${color} (${colorValue})`);
            return true;
        } catch (error) {
            console.error('Erreur envoi MIDI:', error);
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Erreur envoi couleur pad ${padNumber}: ${error.message}`, 'error');
            }
            return false;
        }
    },
    
    // Contrôler les LEDs des boutons de track
    setTrackLED(trackNumber, on = true) {
        if (!this.output || trackNumber < 1 || trackNumber > 8) return false;
        
        const note = 63 + trackNumber; // Notes 64-71
        const velocity = on ? 127 : 0;
        
        try {
            this.output.send([0x90, note, velocity]);
            return true;
        } catch (error) {
            console.error('Erreur contrôle LED track:', error);
            return false;
        }
    },
    
    // Éteindre tous les pads et boutons
    clearAll() {
        if (!this.output) return;
        
        // Batch des messages pour éviter le spam MIDI
        const messages = [];
        
        // Éteindre tous les pads (0-63)
        for (let i = 0; i < 64; i++) {
            messages.push([0x90, i, 0]);
        }
        
        // Éteindre les boutons de track (64-71)
        for (let i = 64; i <= 71; i++) {
            messages.push([0x90, i, 0]);
        }
        
        // Envoyer les messages avec délai pour éviter la saturation
        this.batchSendMessages(messages);
        
        // LEDs éteintes silencieusement
    },
    
    // Envoi groupé des messages MIDI pour éviter la saturation
    async batchSendMessages(messages) {
        if (!this.output || this.isProcessing) return;
        
        this.isProcessing = true;
        const batchSize = 8; // Limiter à 8 messages simultanés
        
        try {
            for (let i = 0; i < messages.length; i += batchSize) {
                const batch = messages.slice(i, i + batchSize);
                
                for (const message of batch) {
                    this.output.send(message);
                }
                
                // Petit délai entre les batches
                if (i + batchSize < messages.length) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
        } catch (error) {
            console.error('Erreur envoi batch MIDI:', error);
        } finally {
            this.isProcessing = false;
        }
    },
    
    // Pattern de test amélioré avec plusieurs modes
    testPattern(mode = 'simple') {
        if (!this.output) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('APC Mini MK1 non connecté', 'warning');
            }
            return;
        }
        
        const patterns = {
            simple: this.simpleTestPattern.bind(this),
            rows: this.rowTestPattern.bind(this),
            spiral: this.spiralTestPattern.bind(this),
            rainbow: this.rainbowTestPattern.bind(this)
        };
        
        const pattern = patterns[mode] || patterns.simple;
        pattern();
    },
    
    // Pattern simple (original)
    simpleTestPattern() {
        const colors = ['GREEN', 'RED', 'YELLOW'];
        let colorIndex = 0;
        
        for (let i = 0; i < 64; i++) {
            setTimeout(() => {
                this.setPadColor(i, colors[colorIndex % 3]);
                colorIndex++;
            }, i * 30);
        }
        
        setTimeout(() => {
            this.clearAll();
            // Test terminé
        }, 3000);
    },
    
    // Pattern par lignes
    rowTestPattern() {
        const colors = ['GREEN', 'RED', 'YELLOW'];
        
        for (let row = 0; row < 8; row++) {
            setTimeout(() => {
                for (let col = 0; col < 8; col++) {
                    const padIndex = row * 8 + col;
                    this.setPadColor(padIndex, colors[row % 3]);
                }
            }, row * 200);
        }
        
        setTimeout(() => {
            this.clearAll();
            // Test terminé
        }, 3000);
    },
    
    // Pattern spiral
    spiralTestPattern() {
        const spiralOrder = this.generateSpiralOrder();
        const colors = ['GREEN', 'RED', 'YELLOW'];
        
        spiralOrder.forEach((padIndex, i) => {
            setTimeout(() => {
                this.setPadColor(padIndex, colors[i % 3]);
            }, i * 50);
        });
        
        setTimeout(() => {
            this.clearAll();
            // Test terminé
        }, 4000);
    },
    
    // Pattern arc-en-ciel (cycle des couleurs)
    rainbowTestPattern() {
        const colors = ['GREEN', 'RED', 'YELLOW'];
        let cycles = 0;
        
        const cycleColors = () => {
            if (cycles >= 6) {
                this.clearAll();
                // Test terminé
                return;
            }
            
            for (let i = 0; i < 64; i++) {
                this.setPadColor(i, colors[(i + cycles) % 3]);
            }
            
            cycles++;
            setTimeout(cycleColors, 300);
        };
        
        cycleColors();
    },
    
    // Générer l'ordre spiral pour le test
    generateSpiralOrder() {
        const order = [];
        let top = 0, bottom = 7, left = 0, right = 7;
        
        while (top <= bottom && left <= right) {
            // Ligne du haut
            for (let i = left; i <= right; i++) {
                order.push(top * 8 + i);
            }
            top++;
            
            // Colonne droite
            for (let i = top; i <= bottom; i++) {
                order.push(i * 8 + right);
            }
            right--;
            
            // Ligne du bas
            if (top <= bottom) {
                for (let i = right; i >= left; i--) {
                    order.push(bottom * 8 + i);
                }
                bottom--;
            }
            
            // Colonne gauche
            if (left <= right) {
                for (let i = bottom; i >= top; i--) {
                    order.push(i * 8 + left);
                }
                left++;
            }
        }
        
        return order;
    },
    
    // ✅ FONCTIONS DE CONVERSION (conservées de l'original)
    
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
    
    // Convertir note MIDI vers index de pad
    noteToPadIndex(note) {
        const { row, col } = this.noteToRowCol(note);
        return row * 8 + col;
    },
    
    // Convertir index de pad vers note MIDI
    padIndexToNote(padIndex) {
        const row = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        return this.rowColToNote(row, col);
    },
    
    // Vérifier l'état de connexion
    isConnected() {
        return this.input !== null && this.output !== null;
    },
    
    // Envoyer un message MIDI custom
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
    
    // Synchroniser l'état avec les modules
    syncWithModules() {
        // Synchroniser les pads
        if (typeof Pads !== 'undefined' && Pads.padConfigs) {
            for (let i = 1; i <= 64; i++) {
                const config = Pads.padConfigs[i];
                if (config && config.active && config.color) {
                    this.setPadColor(config.note, config.color);
                }
            }
        }
        
        // État synchronisé silencieusement
    },
    
    // Mode debug pour voir tous les messages MIDI
    enableDebug() {
        if (this.input) {
            this.input.onmidimessage = (event) => {
                console.log('MIDI reçu:', Array.from(event.data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                this.handleMIDIMessage(event);
            };
            
            // Mode debug activé
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
                manufacturer: this.input.manufacturer || 'Akai Professional',
                id: this.input.id,
                state: this.input.state
            },
            output: {
                name: this.output.name,
                manufacturer: this.output.manufacturer || 'Akai Professional', 
                id: this.output.id,
                state: this.output.state
            },
            specifications: this.APC_MINI_MK1
        };
    },
    
    // Diagnostics de connexion
    async runDiagnostics() {
        const results = {
            webMidiSupport: !!navigator.requestMIDIAccess,
            deviceConnected: this.isConnected(),
            inputLatency: null,
            outputLatency: null,
            errors: []
        };
        
        if (results.webMidiSupport && results.deviceConnected) {
            try {
                // Test de latence
                const start = performance.now();
                this.setPadColor(0, 'GREEN');
                results.outputLatency = performance.now() - start;
                
                setTimeout(() => this.setPadColor(0, 'OFF'), 100);
                
            } catch (error) {
                results.errors.push(`Erreur test latence: ${error.message}`);
            }
        }
        
        return results;
    }
};