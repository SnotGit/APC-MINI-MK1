const Pads = {
    selectedPad: null,
    padConfigs: {},
    isInitialized: false,
    
 
    init() {
        if (this.isInitialized) {
            console.log('Module Pads déjà initialisé');
            return;
        }
        
        try {
            this.createPadGrid();
            this.initializeConfigs();
            this.setupEventListeners();
            this.isInitialized = true;
            
            if (typeof App !== 'undefined' && App.log) {
                App.log('Module Pads initialisé avec succès', 'success');
            }
        } catch (error) {
            console.error('Erreur initialisation Pads:', error);
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Erreur initialisation Pads: ${error.message}`, 'error');
            }
        }
    },
    
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) {
            throw new Error('Élément padGrid non trouvé dans le DOM');
        }
        
        grid.innerHTML = '';
        
        // Créer 64 pads (8x8) - Interface utilisateur numérotée 1-64
        for (let visualRow = 0; visualRow < 8; visualRow++) {
            for (let col = 0; col < 8; col++) {
                // Pad 1 en bas à gauche (interface), 64 en haut à droite
                const padNumber = (7 - visualRow) * 8 + col + 1; // 1 à 64 (interface)
                const noteNumber = this.padNumberToMidiNote(padNumber);
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.dataset.note = noteNumber;
                pad.dataset.row = visualRow;
                pad.dataset.col = col;
                
                // Contenu du pad
                pad.innerHTML = `
                    <div class="pad-number">${padNumber}</div>
                    <div class="pad-label"></div>
                `;
                
                // Event listeners
                pad.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectPad(padNumber);
                });
                
                // Hover effects améliorés
                pad.addEventListener('mouseenter', () => {
                    this.showPadInfo(padNumber);
                });
                
                pad.addEventListener('mouseleave', () => {
                    this.hidePadInfo();
                });
                
                // Support touch pour mobile
                pad.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.selectPad(padNumber);
                }, { passive: false });
                
                grid.appendChild(pad);
            }
        }
        
        // Grille créée silencieusement
    },
    
    // Conversion pad number (1-64) vers note MIDI (0-63) pour APC Mini MK1
    padNumberToMidiNote(padNumber) {
        if (padNumber < 1 || padNumber > 64) {
            console.warn(`Numéro de pad invalide: ${padNumber}`);
            return 0;
        }
        
        // padNumber: 1-64, on convertit en 0-63
        const padIndex = padNumber - 1;
        const visualRow = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        
        // Pour APC Mini MK1: note MIDI = (7 - visualRow) * 8 + col
        const midiNote = (7 - visualRow) * 8 + col;
        return midiNote;
    },
    
    // Conversion note MIDI (0-63) vers pad number (1-64)
    midiNoteToPadNumber(midiNote) {
        const midiRow = Math.floor(midiNote / 8);
        const col = midiNote % 8;
        const visualRow = 7 - midiRow;
        const padNumber = visualRow * 8 + col + 1;
        return padNumber;
    },
    
    initializeConfigs() {
        // Initialiser toutes les configurations de pads
        for (let padNumber = 1; padNumber <= 64; padNumber++) {
            const noteNumber = this.padNumberToMidiNote(padNumber);
            
            this.padConfigs[padNumber] = {
                note: noteNumber,
                name: `Pad ${padNumber}`,
                color: '',
                active: false,
                velocity: 127,
                group: null
            };
        }
        
        // Configurations initialisées silencieusement
    },
    
    setupEventListeners() {
        // Écouter les changements de configuration
        window.addEventListener('pad-config-changed', (event) => {
            this.handleConfigChange(event.detail);
        });
        
        // Écouter les raccourcis clavier
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    },
    
    
    selectPad(padNumber) {
        // Validation
        if (padNumber < 1 || padNumber > 64) {
            console.warn(`Numéro de pad invalide: ${padNumber}`);
            return;
        }
        
        // Désélectionner l'ancien pad
        this.deselectPad();
        
        // Sélectionner le nouveau pad
        this.selectedPad = padNumber;
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (pad) {
            pad.classList.add('selected');
            
            // Animation de sélection
            pad.style.transform = 'scale(1.1)';
            setTimeout(() => {
                if (pad.classList.contains('selected')) {
                    pad.style.transform = '';
                }
            }, 200);
        }
        
        // Afficher la configuration
        this.showPadConfig(padNumber);
        
        // Feedback MIDI si connecté
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                const config = this.padConfigs[padNumber];
                if (config.color) {
                    MIDI.setPadColor(config.note, config.color);
                    // Feedback blink rapide
                    setTimeout(() => {
                        MIDI.setPadColor(config.note, config.active ? config.color : 'OFF');
                    }, 150);
                }
            }
        }
        
        if (typeof App !== 'undefined' && App.log) {
            const noteNumber = this.padConfigs[padNumber].note;
            App.log(`Pad ${padNumber} sélectionné (Note MIDI ${noteNumber})`, 'info');
        }
    },
    
    deselectPad() {
        if (this.selectedPad !== null) {
            const oldPad = document.querySelector(`[data-pad-number="${this.selectedPad}"]`);
            if (oldPad) {
                oldPad.classList.remove('selected');
                oldPad.style.transform = '';
            }
            this.selectedPad = null;
        }
    },
    
    showPadConfig(padNumber) {
        const config = this.padConfigs[padNumber];
        const form = document.getElementById('individualConfig');
        if (!form) return;
        
        form.innerHTML = `
            <div class="pad-config-header">
                <h3>Configuration Pad ${padNumber}</h3>
                <small>Note MIDI: ${config.note}</small>
            </div>
            
            <div class="form-row">
                <label>Nom:</label>
                <input type="text" 
                       id="pad-name" 
                       value="${config.name}" 
                       placeholder="Nom du pad"
                       maxlength="20">
            </div>
            
            <div class="form-row">
                <label>Couleur:</label>
                <select id="pad-color" onchange="Pads.updatePadColor(${padNumber}, this.value)">
                    <option value="" ${config.color === '' ? 'selected' : ''}>
                        Aucune (contrôle Ableton)
                    </option>
                    <option value="GREEN" ${config.color === 'GREEN' ? 'selected' : ''}>
                        🟢 Vert
                    </option>
                    <option value="RED" ${config.color === 'RED' ? 'selected' : ''}>
                        🔴 Rouge
                    </option>
                    <option value="YELLOW" ${config.color === 'YELLOW' ? 'selected' : ''}>
                        🟡 Jaune
                    </option>
                </select>
            </div>
        `;
        
        // Événement de changement de nom avec debounce
        const nameInput = document.getElementById('pad-name');
        if (nameInput) {
            let timeout;
            nameInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.updatePadName(padNumber, e.target.value);
                }, 300);
            });
        }
    },
    
    updatePadName(padNumber, name) {
        if (!name || name.trim() === '') {
            name = `Pad ${padNumber}`;
        }
        
        this.padConfigs[padNumber].name = name.trim();
        this.updatePadDisplay(padNumber);
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Nom du pad ${padNumber} changé: "${name}"`, 'info');
        }
    },
    
    updatePadColor(padNumber, color) {
        this.padConfigs[padNumber].color = color;
        
        // Feedback MIDI immédiat
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(this.padConfigs[padNumber].note, color || 'OFF');
            }
        }
        
        this.updatePadDisplay(padNumber);
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Couleur du pad ${padNumber} → ${color || 'Aucune'}`, 'info');
        }
    },
    
    togglePad(padNumber) {
        const config = this.padConfigs[padNumber];
        config.active = !config.active;
        
        // Feedback MIDI
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(config.note, config.active && config.color ? config.color : 'OFF');
            }
        }
        
        this.updatePadDisplay(padNumber);
        
        // Mettre à jour le bouton si le pad est sélectionné
        if (this.selectedPad === padNumber) {
            this.showPadConfig(padNumber);
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Pad ${padNumber} ${config.active ? 'activé' : 'désactivé'}`, 'info');
        }
    },
    
    updatePadDisplay(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        const config = this.padConfigs[padNumber];
        
        if (pad) {
            // Retirer toutes les classes de couleur
            pad.classList.remove('assigned', 'active', 'assigned-green', 'assigned-red', 'assigned-yellow');
            
            // Appliquer la nouvelle couleur
            if (config.color) {
                pad.classList.add('assigned', 'assigned-' + config.color.toLowerCase());
            }
            
            // État actif
            if (config.active) {
                pad.classList.add('active');
            }
            
            // Mettre à jour le label
            const labelElement = pad.querySelector('.pad-label');
            if (labelElement) {
                labelElement.textContent = config.name !== `Pad ${padNumber}` ? config.name : '';
            }
            
            // Mettre à jour le tooltip
            pad.title = `${config.name} | Note: ${config.note} | ${config.color || 'Sans couleur'} | ${config.active ? 'Actif' : 'Inactif'}`;
        }
    },
    
    showPadInfo(padNumber) {
        // Afficher info rapide dans un tooltip personnalisé
        const config = this.padConfigs[padNumber];
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        
        if (pad && !pad.classList.contains('selected')) {
            pad.style.borderColor = '#5aa3d0';
            pad.style.transform = 'scale(1.05)';
        }
    },
    
    hidePadInfo() {
        // Cacher l'info rapide
        const pads = document.querySelectorAll('.pad:not(.selected)');
        pads.forEach(pad => {
            pad.style.borderColor = '';
            pad.style.transform = '';
        });
    },
    
    // Configuration par groupes (4x4 quadrants)
    assignGroup(groupIndex, color) {
        const groupMappings = [
            { startRow: 4, endRow: 7, startCol: 0, endCol: 3 }, // Groupe 1: Haut-gauche
            { startRow: 4, endRow: 7, startCol: 4, endCol: 7 }, // Groupe 2: Haut-droite
            { startRow: 0, endRow: 3, startCol: 0, endCol: 3 }, // Groupe 3: Bas-gauche
            { startRow: 0, endRow: 3, startCol: 4, endCol: 7 }  // Groupe 4: Bas-droite
        ];
        
        if (groupIndex < 0 || groupIndex >= groupMappings.length) {
            console.warn(`Index de groupe invalide: ${groupIndex}`);
            return;
        }
        
        const mapping = groupMappings[groupIndex];
        let assignedCount = 0;
        
        for (let row = mapping.startRow; row <= mapping.endRow; row++) {
            for (let col = mapping.startCol; col <= mapping.endCol; col++) {
                const padNumber = row * 8 + col + 1;
                
                if (padNumber >= 1 && padNumber <= 64) {
                    this.padConfigs[padNumber].color = color;
                    this.padConfigs[padNumber].group = groupIndex;
                    this.updatePadDisplay(padNumber);
                    
                    // Feedback MIDI
                    if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
                        if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                            setTimeout(() => {
                                MIDI.setPadColor(this.padConfigs[padNumber].note, color);
                            }, assignedCount * 20); // Délai progressif pour effet visuel
                        }
                    }
                    
                    assignedCount++;
                }
            }
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Groupe ${groupIndex + 1} configuré (${assignedCount} pads) → ${color}`, 'success');
        }
    },
    
  
    // Sauvegarder la configuration
    saveConfig() {
        const event = new CustomEvent('config-changed', {
            detail: { pads: this.padConfigs }
        });
        window.dispatchEvent(event);
    },
    
    // Charger la configuration
    loadConfig(config) {
        if (config && config.pads) {
            // Fusionner avec la configuration existante
            for (const [padNumber, padConfig] of Object.entries(config.pads)) {
                if (this.padConfigs[padNumber]) {
                    this.padConfigs[padNumber] = { ...this.padConfigs[padNumber], ...padConfig };
                    this.updatePadDisplay(padNumber);
                }
            }
            
            // Configuration chargée silencieusement
        }
    },
    
    // Réinitialiser tous les pads
    clearAllPads() {
        for (let padNumber = 1; padNumber <= 64; padNumber++) {
            this.resetPadConfig(padNumber);
        }
        
        // Éteindre les LEDs
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.clearAll) {
                MIDI.clearAll();
            }
        }
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('Tous les pads réinitialisés', 'info');
        }
    },
    
    // Exporter la configuration pour d'autres utilisations
    exportConfig() {
        return {
            version: '1.0',
            device: 'APC Mini MK1',
            timestamp: new Date().toISOString(),
            pads: this.padConfigs,
        };
    }
};