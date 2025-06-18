const Pads = {
    
    // État minimal
    selectedPad: null,
    selectedGroup: null,
    currentMode: 'individual', // 'individual' | 'groups'
    padConfigs: {},
    sequencerEnabled: false,
    isInitialized: false,
    
    // Définition groupes (selon vos directives)
    groups: {
        1: { name: 'Bas-Gauche', pads: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28] },
        2: { name: 'Haut-Gauche', pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] },
        3: { name: 'Haut-Droite', pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64] },
        4: { name: 'Bas-Droite', pads: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32] }
    },

    // Initialisation
    init() {
        if (this.isInitialized) return;
        
        this.createPadGrid();
        this.initPadConfigs();
        this.setupEvents();
        this.isInitialized = true;
    },

    // Générer grille 64 pads
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const padNumber = (7 - row) * 8 + col + 1; // 1-64
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.innerHTML = `<div class="pad-number">${padNumber}</div>`;
                
                grid.appendChild(pad);
            }
        }
    },

    // Initialiser configs pads
    initPadConfigs() {
        for (let i = 1; i <= 64; i++) {
            this.padConfigs[i] = {
                color: null,
                group: this.findPadGroup(i)
            };
        }
    },

    // Trouver groupe d'un pad
    findPadGroup(padNumber) {
        for (const [groupId, group] of Object.entries(this.groups)) {
            if (group.pads.includes(padNumber)) {
                return parseInt(groupId);
            }
        }
        return null;
    },

    // Event listeners
    setupEvents() {
        // Boutons mode Pad/Groupe
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });

        // Clics sur pads
        document.addEventListener('click', (e) => {
            const pad = e.target.closest('.pad');
            if (pad) {
                const padNumber = parseInt(pad.dataset.padNumber);
                this.handlePadClick(padNumber);
            }
        });
    },

    // Basculer mode
    switchMode(mode) {
        // Convertir les noms des modes HTML vers JS
        const jsMode = mode === 'pad' ? 'individual' : 'groups';
        this.currentMode = jsMode;
        this.selectedPad = null;
        this.selectedGroup = null;
        
        // Mettre à jour boutons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Afficher interface selon mode
        if (jsMode === 'individual') {
            this.showPadModeInterface();
        } else if (jsMode === 'groups') {
            this.showGroupModeInterface();
        }
        
        this.updatePadVisuals();
    },

    // Clic sur pad
    handlePadClick(padNumber) {
        if (this.currentMode === 'individual') {
            this.selectPad(padNumber);
        }
        // En mode groupe, les clics sur pads ne font rien
    },

    // Sélectionner pad individuel
    selectPad(padNumber) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber);
        this.updatePadVisuals();
    },

    // Sélectionner groupe
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        // Mettre à jour boutons groupes
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.group) === groupId);
        });
        
        this.updateSequencerOption();
        this.updatePadVisuals();
    },

    // Mettre à jour info pad sélectionné
    updatePadInfo(padNumber) {
        const infoContent = document.querySelector('.info-content');
        if (infoContent && padNumber) {
            const midiNote = padNumber - 1;
            infoContent.textContent = `PAD ${padNumber} / NOTE ${midiNote}`;
        }
    },

    // Appliquer couleur en mode PAD
    applyPadColor(color) {
        if (!this.selectedPad) return;
        
        this.padConfigs[this.selectedPad].color = color;
        this.updatePadVisual(this.selectedPad);
        this.sendMIDIColor(this.selectedPad, color);
        this.saveConfig();
    },

    // Appliquer couleur en mode GROUPE
    applyGroupColor(color) {
        if (!this.selectedGroup) return;
        
        const group = this.groups[this.selectedGroup];
        
        group.pads.forEach(padNumber => {
            // Respecter limitation séquenceur pour groupe 3
            if (this.selectedGroup === 3 && this.sequencerEnabled) {
                const controls = [37,38,39,40]; // 4 premiers = contrôles
                if (controls.includes(padNumber)) return;
            }
            
            this.padConfigs[padNumber].color = color;
            this.updatePadVisual(padNumber);
            this.sendMIDIColor(padNumber, color);
        });
        
        this.saveConfig();
    },

    // Interface mode PADS
    showPadModeInterface() {
        const configPanel = document.getElementById('configContent');
        if (!configPanel) return;

        configPanel.innerHTML = `
            <div class="info-section">
                <div class="info-title">INFORMATIONS PAD SELECTED</div>
                <div class="info-content">NUMERO PAD / NOTE PAD</div>
            </div>
            
            <div class="color-section">
                <button class="color-btn green" onclick="Pads.applyPadColor('green')"></button>
                <button class="color-btn yellow" onclick="Pads.applyPadColor('yellow')"></button>
                <button class="color-btn red" onclick="Pads.applyPadColor('red')"></button>
                <button class="color-btn clear" onclick="Pads.applyPadColor(null)">CLEAR</button>
            </div>
        `;
    },

    // Interface mode GROUPES
    showGroupModeInterface() {
        const configPanel = document.getElementById('configContent');
        if (!configPanel) return;

        configPanel.innerHTML = `
            <div class="groups-section">
                <button class="group-btn" data-group="1" onclick="Pads.selectGroup(1)">GROUPE 1</button>
                <button class="group-btn" data-group="2" onclick="Pads.selectGroup(2)">GROUPE 2</button>
                <button class="group-btn" data-group="3" onclick="Pads.selectGroup(3)">GROUPE 3</button>
                <button class="group-btn" data-group="4" onclick="Pads.selectGroup(4)">GROUPE 4</button>
            </div>
            
            <div class="color-section">
                <button class="color-btn green" onclick="Pads.applyGroupColor('green')"></button>
                <button class="color-btn yellow" onclick="Pads.applyGroupColor('yellow')"></button>
                <button class="color-btn red" onclick="Pads.applyGroupColor('red')"></button>
                <button class="color-btn clear" onclick="Pads.applyGroupColor(null)">CLEAR</button>
            </div>
            
            <div class="sequencer-section">
                <label class="sequencer-toggle">
                    <input type="checkbox" ${this.sequencerEnabled ? 'checked' : ''} onchange="Pads.toggleSequencer(this.checked)">
                    ACTIVER SEQUENCEUR
                </label>
            </div>
        `;
        
        this.updateSequencerOption();
    },

    // Mettre à jour option séquenceur selon groupe sélectionné
    updateSequencerOption() {
        const checkbox = document.querySelector('.sequencer-toggle input');
        const label = document.querySelector('.sequencer-toggle');
        
        if (checkbox && label) {
            if (this.selectedGroup === 2 || this.selectedGroup === 3) {
                label.style.opacity = '1';
                checkbox.disabled = false;
            } else {
                label.style.opacity = '0.5';
                checkbox.disabled = true;
            }
        }
    },

    // Toggle séquenceur
    toggleSequencer(enabled) {
        this.sequencerEnabled = enabled;
        
        if (enabled) {
            // 4 premiers pads groupe 3 = contrôles (jaune)
            [37,38,39,40].forEach(pad => {
                this.padConfigs[pad].color = 'yellow';
                this.updatePadVisual(pad);
                this.sendMIDIColor(pad, 'yellow');
            });
        } else {
            // Restaurer groupe 3 complet
            this.groups[3].pads.forEach(pad => {
                this.updatePadVisual(pad);
                this.sendMIDIColor(pad, this.padConfigs[pad].color);
            });
        }
        
        this.saveConfig();
    },

    // Mettre à jour visuel pad
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        // Reset classes
        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-red', 'color-yellow');

        // Sélection pad individuel (mode PADS)
        if (this.currentMode === 'individual' && this.selectedPad === padNumber) {
            pad.classList.add('selected');
        }
        
        // Surlignage groupe (mode GROUPES)
        if (this.currentMode === 'groups' && this.selectedGroup && this.findPadGroup(padNumber) === this.selectedGroup) {
            pad.classList.add('group-highlight');
        }

        // Couleur
        const color = this.padConfigs[padNumber].color;
        if (color) {
            pad.classList.add(`color-${color}`);
        }
    },

    // Mettre à jour tous les visuels
    updatePadVisuals() {
        for (let i = 1; i <= 64; i++) {
            this.updatePadVisual(i);
        }
    },

    // Envoyer couleur MIDI
    sendMIDIColor(padNumber, color) {
        if (!App.isConnected() || typeof MIDI === 'undefined') return;
        
        const midiNote = padNumber - 1; // Pad 1-64 → MIDI 0-63
        const colorMap = { green: 'GREEN', red: 'RED', yellow: 'YELLOW' };
        MIDI.setPadColor(midiNote, colorMap[color] || 'OFF');
    },

    // Sauvegarde
    saveConfig() {
        App.updateConfig('pads', {
            padConfigs: this.padConfigs,
            sequencerEnabled: this.sequencerEnabled
        });
    },

    // Chargement
    loadConfig(config) {
        if (config.pads?.padConfigs) {
            this.padConfigs = { ...this.padConfigs, ...config.pads.padConfigs };
        }
        if (config.pads?.sequencerEnabled !== undefined) {
            this.sequencerEnabled = config.pads.sequencerEnabled;
        }
        
        this.updatePadVisuals();
    },

    // API pour autres modules
    deselectAll() {
        this.selectedPad = null;
        this.selectedGroup = null;
        
        // Reset interface selon mode
        if (this.currentMode === 'individual') {
            this.showPadModeInterface();
        } else if (this.currentMode === 'groups') {
            this.showGroupModeInterface();
        }
        
        this.updatePadVisuals();
    }
};

// Event listener global
window.addEventListener('config-changed', (event) => {
    if (event.detail.pads) {
        Pads.loadConfig(event.detail);
    }
});