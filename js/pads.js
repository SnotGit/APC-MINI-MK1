
const Pads = {
    
    // ===== ÉTAT ===== //
    selectedPad: null,
    currentMode: 'individual', // 'individual' | 'groups'
    padConfigs: {},
    isInitialized: false,
    
    // ===== GROUPES 4x4 ===== //
    groups: {
        0: { name: 'Groupe 1', range: 'Haut-gauche', color: 'GREEN', pads: [] },
        1: { name: 'Groupe 2', range: 'Haut-droite', color: 'RED', pads: [] },
        2: { name: 'Groupe 3', range: 'Step Sequencer', color: null, pads: [] }, // Géré par sequencer
        3: { name: 'Groupe 4', range: 'Bas-droite', color: 'YELLOW', pads: [] }
    },

    // ===== INITIALISATION ===== //
    init() {
        if (this.isInitialized) return;
        
        this.createPadGrid();
        this.setupGroupMapping();
        this.setupEventListeners();
        this.setupModeSelector();
        this.isInitialized = true;
        
        App.log('✅ Module Pads initialisé', 'info');
    },

    // ===== CRÉATION GRILLE ===== //
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Créer 64 pads (8x8)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Interface: Pad 1 en bas-gauche, 64 en haut-droite
                const padNumber = (7 - row) * 8 + col + 1; // 1-64
                const midiNote = this.padToMIDI(padNumber); // 0-63
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.dataset.midiNote = midiNote;
                pad.dataset.row = row;
                pad.dataset.col = col;
                
                // Contenu pad
                pad.innerHTML = `
                    <div class="pad-number">${padNumber}</div>
                    <div class="pad-name"></div>
                `;
                
                // Events
                pad.addEventListener('click', () => this.selectPad(padNumber));
                pad.addEventListener('mouseenter', () => this.showPadPreview(padNumber));
                pad.addEventListener('mouseleave', () => this.hidePadPreview());
                
                grid.appendChild(pad);
                
                // Initialiser config
                this.initPadConfig(padNumber, midiNote);
            }
        }
    },

    // ===== MAPPING MIDI ===== //
    padToMIDI(padNumber) {
        // Pad 1-64 → Note MIDI 0-63
        const padIndex = padNumber - 1;
        const visualRow = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        return (7 - visualRow) * 8 + col;
    },

    midiToPad(midiNote) {
        // Note MIDI 0-63 → Pad 1-64
        const midiRow = Math.floor(midiNote / 8);
        const col = midiNote % 8;
        const visualRow = 7 - midiRow;
        return visualRow * 8 + col + 1;
    },

    // ===== CONFIGURATION PADS ===== //
    initPadConfig(padNumber, midiNote) {
        this.padConfigs[padNumber] = {
            midiNote: midiNote,
            name: '',
            color: '',
            active: false,
            group: this.getPadGroup(padNumber)
        };
    },

    getPadGroup(padNumber) {
        // Définir les groupes 4x4
        // Interface: rangées 7-8 (haut), 5-6, 3-4, 1-2 (bas)
        // Colonnes: 1-4 (gauche), 5-8 (droite)
        
        const padIndex = padNumber - 1;
        const row = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        
        if (row >= 4 && col < 4) return 0; // Groupe 1: Haut-gauche
        if (row >= 4 && col >= 4) return 1; // Groupe 2: Haut-droite  
        if (row < 4 && col < 4) return 2; // Groupe 3: Bas-gauche (Sequencer)
        if (row < 4 && col >= 4) return 3; // Groupe 4: Bas-droite
        
        return null;
    },

    // ===== SÉLECTION PADS ===== //
    selectPad(padNumber) {
        if (this.selectedPad === padNumber) {
            this.deselectPad();
            return;
        }
        
        this.deselectPad();
        this.selectedPad = padNumber;
        
        const pad = this.getPadElement(padNumber);
        if (pad) {
            pad.classList.add('selected');
        }
        
        // Afficher configuration en mode individuel
        if (this.currentMode === 'individual') {
            this.showPadConfig(padNumber);
        }
        
        // Feedback MIDI
        this.sendPadFeedback(padNumber);
        
        App.log(`🎯 Pad ${padNumber} sélectionné`, 'info');
    },

    deselectPad() {
        if (this.selectedPad) {
            const pad = this.getPadElement(this.selectedPad);
            if (pad) {
                pad.classList.remove('selected');
            }
            this.selectedPad = null;
        }
    },

    deselectAll() {
        this.deselectPad();
    },

    // ===== CONFIGURATION INDIVIDUELLE ===== //
    showPadConfig(padNumber) {
        const config = this.padConfigs[padNumber];
        const container = document.getElementById('individual-config');
        if (!container) return;
        
        container.innerHTML = `
            <div class="config-header">
                <h3>Configuration Pad ${padNumber}</h3>
                <small>Note MIDI: ${config.midiNote} | Groupe: ${config.group + 1}</small>
            </div>
            
            <div class="form-group">
                <label>Nom du pad:</label>
                <input type="text" 
                       id="pad-name-input" 
                       value="${config.name}" 
                       placeholder="Ex: Kick, Snare..."
                       maxlength="12">
            </div>
            
            <div class="form-group">
                <label>Couleur:</label>
                <div class="color-selector">
                    <button class="color-option ${config.color === '' ? 'active' : ''}" 
                            data-color="" title="Aucune (contrôle Ableton)">
                        <span class="color-preview none"></span>
                        Aucune
                    </button>
                    <button class="color-option ${config.color === 'GREEN' ? 'active' : ''}" 
                            data-color="GREEN" title="Vert">
                        <span class="color-preview green"></span>
                        Vert
                    </button>
                    <button class="color-option ${config.color === 'RED' ? 'active' : ''}" 
                            data-color="RED" title="Rouge">
                        <span class="color-preview red"></span>
                        Rouge
                    </button>
                    <button class="color-option ${config.color === 'YELLOW' ? 'active' : ''}" 
                            data-color="YELLOW" title="Jaune">
                        <span class="color-preview yellow"></span>
                        Jaune
                    </button>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="Pads.resetPad(${padNumber})">
                    Réinitialiser
                </button>
                <button class="btn ${config.active ? 'btn-primary' : ''}" 
                        onclick="Pads.togglePad(${padNumber})">
                    ${config.active ? 'Désactiver' : 'Activer'}
                </button>
            </div>
        `;
        
        // Event listeners
        this.setupPadConfigEvents(padNumber);
    },

    setupPadConfigEvents(padNumber) {
        // Nom du pad
        const nameInput = document.getElementById('pad-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.updatePadName(padNumber, e.target.value);
            });
        }
        
        // Couleurs
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                this.updatePadColor(padNumber, color);
                this.showPadConfig(padNumber); // Refresh
            });
        });
    },

    updatePadName(padNumber, name) {
        this.padConfigs[padNumber].name = name.trim();
        this.updatePadDisplay(padNumber);
        this.saveConfig();
    },

    updatePadColor(padNumber, color) {
        this.padConfigs[padNumber].color = color;
        this.updatePadDisplay(padNumber);
        this.sendPadColor(padNumber, color);
        this.saveConfig();
        
        App.log(`🎨 Pad ${padNumber} → ${color || 'Aucune'}`, 'info');
    },

    togglePad(padNumber) {
        const config = this.padConfigs[padNumber];
        config.active = !config.active;
        
        this.updatePadDisplay(padNumber);
        this.sendPadColor(padNumber, config.active ? config.color : '');
        this.saveConfig();
        
        if (this.selectedPad === padNumber) {
            this.showPadConfig(padNumber); // Refresh
        }
        
        App.log(`🔄 Pad ${padNumber} ${config.active ? 'activé' : 'désactivé'}`, 'info');
    },

    resetPad(padNumber) {
        this.padConfigs[padNumber] = {
            ...this.padConfigs[padNumber],
            name: '',
            color: '',
            active: false
        };
        
        this.updatePadDisplay(padNumber);
        this.sendPadColor(padNumber, '');
        this.saveConfig();
        
        if (this.selectedPad === padNumber) {
            this.showPadConfig(padNumber); // Refresh
        }
        
        App.log(`🔄 Pad ${padNumber} réinitialisé`, 'info');
    },

    // ===== AFFICHAGE PADS ===== //
    updatePadDisplay(padNumber) {
        const pad = this.getPadElement(padNumber);
        const config = this.padConfigs[padNumber];
        if (!pad) return;
        
        // Reset classes
        pad.classList.remove('color-green', 'color-red', 'color-yellow', 'active', 'assigned');
        
        // Couleur
        if (config.color) {
            pad.classList.add(`color-${config.color.toLowerCase()}`, 'assigned');
        }
        
        // État actif
        if (config.active) {
            pad.classList.add('active');
        }
        
        // Nom
        const nameEl = pad.querySelector('.pad-name');
        if (nameEl) {
            nameEl.textContent = config.name;
        }
        
        // Tooltip
        pad.title = `Pad ${padNumber} | MIDI: ${config.midiNote} | ${config.name || 'Sans nom'} | ${config.color || 'Aucune couleur'}`;
    },

    // ===== GESTION GROUPES ===== //
    setupGroupMapping() {
        // Calculer les pads pour chaque groupe
        for (let padNumber = 1; padNumber <= 64; padNumber++) {
            const group = this.getPadGroup(padNumber);
            if (group !== null) {
                this.groups[group].pads.push(padNumber);
            }
        }
        
        this.setupGroupsInterface();
    },

    setupGroupsInterface() {
        // Event listeners pour les groupes
        document.querySelectorAll('.group-card').forEach(card => {
            const groupIndex = parseInt(card.dataset.group);
            
            // Sélecteurs de couleur (sauf groupe 3)
            if (groupIndex !== 2) {
                card.querySelectorAll('.color-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const color = btn.dataset.color;
                        this.assignGroup(groupIndex, color);
                    });
                });
            }
        });
    },

    assignGroup(groupIndex, color) {
        if (groupIndex === 2) return; // Groupe 3 géré par sequencer
        
        const group = this.groups[groupIndex];
        group.color = color;
        
        let count = 0;
        group.pads.forEach(padNumber => {
            this.padConfigs[padNumber].color = color;
            this.updatePadDisplay(padNumber);
            
            // Feedback MIDI progressif
            setTimeout(() => {
                this.sendPadColor(padNumber, color);
            }, count * 20);
            count++;
        });
        
        this.updateGroupInterface(groupIndex, color);
        this.saveConfig();
        
        App.log(`🎨 ${group.name} → ${color} (${group.pads.length} pads)`, 'success');
    },

    updateGroupInterface(groupIndex, activeColor) {
        const card = document.querySelector(`[data-group="${groupIndex}"]`);
        if (!card) return;
        
        card.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color === activeColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    // ===== MODE SELECTOR ===== //
    setupModeSelector() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
    },

    switchMode(mode) {
        this.currentMode = mode;
        
        // UI mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Sections
        const individualConfig = document.getElementById('individual-config');
        const groupsConfig = document.getElementById('groups-config');
        
        if (mode === 'individual') {
            if (individualConfig) individualConfig.classList.remove('hidden');
            if (groupsConfig) groupsConfig.classList.add('hidden');
            
            // Désélectionner pour forcer re-sélection
            this.deselectPad();
        } else {
            if (individualConfig) individualConfig.classList.add('hidden');
            if (groupsConfig) groupsConfig.classList.remove('hidden');
            
            this.deselectPad();
        }
        
        App.log(`🔄 Mode ${mode} activé`, 'info');
    },

    // ===== MIDI ===== //
    sendPadColor(padNumber, color) {
        if (!App.isConnected() || typeof MIDI === 'undefined') return;
        
        const config = this.padConfigs[padNumber];
        const midiNote = config.midiNote;
        
        MIDI.setPadColor(midiNote, color || 'OFF');
    },

    sendPadFeedback(padNumber) {
        if (!App.isConnected()) return;
        
        const config = this.padConfigs[padNumber];
        if (config.color) {
            this.sendPadColor(padNumber, config.color);
            
            // Blink rapide pour feedback
            setTimeout(() => {
                this.sendPadColor(padNumber, '');
            }, 100);
            setTimeout(() => {
                this.sendPadColor(padNumber, config.color);
            }, 200);
        }
    },

    syncToMIDI() {
        // Synchroniser tous les pads actifs
        Object.keys(this.padConfigs).forEach(padNumber => {
            const config = this.padConfigs[padNumber];
            if (config.active && config.color) {
                this.sendPadColor(padNumber, config.color);
            }
        });
        
        App.log('🔄 Pads synchronisés avec MIDI', 'info');
    },

    handleMIDIPreview(message) {
        const { status, note, velocity } = message;
        
        if (status === 0x90 && velocity > 0) { // Note On
            const padNumber = this.midiToPad(note);
            
            // Feedback visuel seulement
            const pad = this.getPadElement(padNumber);
            if (pad) {
                pad.classList.add('midi-feedback');
                setTimeout(() => {
                    pad.classList.remove('midi-feedback');
                }, 200);
            }
            
            App.log(`🎹 Pad ${padNumber} pressé (MIDI ${note})`, 'info');
        }
    },

    // ===== PREVIEW ===== //
    showPadPreview(padNumber) {
        const pad = this.getPadElement(padNumber);
        if (pad && !pad.classList.contains('selected')) {
            pad.style.borderColor = '#5aa3d0';
        }
    },

    hidePadPreview() {
        document.querySelectorAll('.pad:not(.selected)').forEach(pad => {
            pad.style.borderColor = '';
        });
    },

    // ===== CONFIGURATION ===== //
    saveConfig() {
        App.updateConfig('pads', this.padConfigs);
    },

    loadConfig(config) {
        if (config.pads) {
            this.padConfigs = { ...this.padConfigs, ...config.pads };
            
            // Mettre à jour affichage
            Object.keys(this.padConfigs).forEach(padNumber => {
                this.updatePadDisplay(padNumber);
            });
        }
    },

    // ===== UTILITAIRES ===== //
    getPadElement(padNumber) {
        return document.querySelector(`[data-pad-number="${padNumber}"]`);
    },

    clearAll() {
        Object.keys(this.padConfigs).forEach(padNumber => {
            this.resetPad(padNumber);
        });
        
        App.log('🧹 Tous les pads effacés', 'info');
    }
};

// ===== EVENT LISTENERS ===== //
window.addEventListener('config-changed', (event) => {
    if (event.detail.pads) {
        Pads.loadConfig(event.detail);
    }
});