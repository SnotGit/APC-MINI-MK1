const Pads = {
    
    selectedPad: null,
    selectedGroup: null,
    currentMode: 'individual',
    padConfigs: {},
    sequencerEnabled: false,
    isInitialized: false,
    
    // ===== GROUPES DE PADS (NUMÉROS HUMAINS 1-64) =====
    groups: {
        1: { name: 'Bas-Gauche', pads: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28] },
        2: { name: 'Haut-Gauche', pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] },
        3: { name: 'Haut-Droite', pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64] },
        4: { name: 'Bas-Droite', pads: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32] }
    },

    // ===== CONTRÔLES SÉQUENCEUR =====
    sequencerControls: {
        2: {
            pads: [25, 26, 27, 28],
            midi: [24, 25, 26, 27],
            functions: ['play_stop', 'scale_mode', 'pattern_length', 'clear'],
            colors: [null, 'green', 'yellow', 'red']
        },
        3: {
            pads: [29, 30, 31, 32],
            midi: [28, 29, 30, 31],
            functions: ['play_stop', 'scale_mode', 'pattern_length', 'clear'],
            colors: [null, 'green', 'yellow', 'red']
        }
    },

    init() {
        if (this.isInitialized) return;
        
        this.createPadGrid();
        this.initPadConfigs();
        this.setupEvents();
        this.showPadModeInterface();
        this.isInitialized = true;
        
        // Charger config après initialisation complète
        window.addEventListener('config-changed', this.handleConfigChanged.bind(this));
    },

    handleConfigChanged(event) {
        if (event.detail.pads) {
            this.loadConfig(event.detail);
        }
    },

    // ===== CRÉATION GRILLE =====
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const padNumber = (7 - row) * 8 + col + 1;
                const midiNote = padNumber - 1;
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.dataset.midiNote = midiNote;
                pad.innerHTML = `<div class="pad-number">${padNumber}</div>`;
                
                grid.appendChild(pad);
            }
        }
    },

    initPadConfigs() {
        for (let i = 1; i <= 64; i++) {
            this.padConfigs[i] = {
                color: null,
                group: this.findPadGroup(i)
            };
        }
    },

    findPadGroup(padNumber) {
        for (const [groupId, group] of Object.entries(this.groups)) {
            if (group.pads.includes(padNumber)) {
                return parseInt(groupId);
            }
        }
        return null;
    },

    // ===== ÉVÉNEMENTS =====
    setupEvents() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });

        document.addEventListener('click', (e) => {
            const pad = e.target.closest('.pad');
            if (pad) {
                const padNumber = parseInt(pad.dataset.padNumber);
                this.handlePadClick(padNumber);
            }
        });
    },

    switchMode(mode) {
        this.currentMode = mode;
        this.selectedPad = null;
        this.selectedGroup = null;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        if (mode === 'individual') {
            this.showPadModeInterface();
        } else {
            this.showGroupModeInterface();
        }
        
        this.updatePadVisuals();
    },

    handlePadClick(padNumber) {
        if (this.currentMode === 'individual') {
            this.selectPad(padNumber);
        }
    },

    selectPad(padNumber) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber);
        this.updatePadVisuals();
    },

    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.group) === groupId);
        });
        
        this.updateSequencerOption();
        this.updatePadVisuals();
    },

    updatePadInfo(padNumber) {
        const infoContent = document.querySelector('.info-content');
        if (infoContent && padNumber) {
            const midiNote = padNumber - 1;
            infoContent.textContent = `PAD ${padNumber} / NOTE ${midiNote}`;
        }
    },

    // ===== APPLICATION COULEURS =====
    applyPadColor(color) {
        if (!this.selectedPad) return;
        
        this.padConfigs[this.selectedPad].color = color;
        this.updatePadVisual(this.selectedPad);
        this.sendMIDIColor(this.selectedPad, color);
        this.saveConfig();
        
        this.selectedPad = null;
        this.updatePadVisuals();
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) return;
        
        const group = this.groups[this.selectedGroup];
        
        group.pads.forEach(padNumber => {
            if (this.selectedGroup === 2 || this.selectedGroup === 3) {
                const controls = this.sequencerControls[this.selectedGroup];
                if (controls && controls.pads.includes(padNumber) && this.sequencerEnabled) {
                    return;
                }
            }
            
            this.padConfigs[padNumber].color = color;
            this.updatePadVisual(padNumber);
            this.sendMIDIColor(padNumber, color);
        });
        
        this.saveConfig();
    },

    // ===== INTERFACES =====
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
                    <input type="checkbox" id="sequencerCheckbox" ${this.sequencerEnabled ? 'checked' : ''} onchange="Pads.toggleSequencer(this.checked)">
                    ACTIVER SEQUENCEUR
                </label>
            </div>
        `;
        
        this.updateSequencerOption();
    },

    updateSequencerOption() {
        const checkbox = document.getElementById('sequencerCheckbox');
        const label = document.querySelector('.sequencer-toggle');
        
        if (checkbox && label) {
            checkbox.checked = this.sequencerEnabled && (this.selectedGroup === 2 || this.selectedGroup === 3);
            
            if (this.selectedGroup === 2 || this.selectedGroup === 3) {
                label.style.opacity = '1';
                checkbox.disabled = false;
            } else {
                label.style.opacity = '0.5';
                checkbox.disabled = true;
                if (this.sequencerEnabled) {
                    this.sequencerEnabled = false;
                    checkbox.checked = false;
                }
            }
        }
    },

    toggleSequencer(enabled) {
        this.sequencerEnabled = enabled;
        
        if (enabled && (this.selectedGroup === 2 || this.selectedGroup === 3)) {
            const controls = this.sequencerControls[this.selectedGroup];
            if (controls) {
                controls.pads.forEach((pad, index) => {
                    this.padConfigs[pad].color = controls.colors[index];
                    this.updatePadVisual(pad);
                    if (controls.colors[index]) {
                        this.sendMIDIColor(pad, controls.colors[index]);
                    }
                });
            }
            
            // Notifier app.js avec le nouveau event
            window.dispatchEvent(new CustomEvent('sequencer-group-activated', {
                detail: { groupId: this.selectedGroup }
            }));
            
        } else if (!enabled && (this.selectedGroup === 2 || this.selectedGroup === 3)) {
            const controls = this.sequencerControls[this.selectedGroup];
            if (controls) {
                controls.pads.forEach(pad => {
                    this.padConfigs[pad].color = null;
                    this.updatePadVisual(pad);
                    this.sendMIDIColor(pad, null);
                });
            }
            
            // Notifier la désactivation
            window.dispatchEvent(new CustomEvent('sequencer-deactivated'));
        }
        
        this.saveConfig();
    },

    // ===== VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-red', 'color-yellow', 'sequencer-control', 'assigned');

        if (this.currentMode === 'individual' && this.selectedPad === padNumber) {
            pad.classList.add('selected');
        }
        
        const color = this.padConfigs[padNumber].color;
        if (color) {
            pad.classList.add(`color-${color}`);
            pad.classList.add('assigned');
        } else if (this.currentMode === 'groups' && this.selectedGroup && this.findPadGroup(padNumber) === this.selectedGroup) {
            pad.classList.add('group-highlight');
        }

        if (this.isSequencerControlPad(padNumber)) {
            pad.classList.add('sequencer-control');
        }
    },

    isSequencerControlPad(padNumber) {
        if (!this.sequencerEnabled) return false;
        
        for (const [groupId, controls] of Object.entries(this.sequencerControls)) {
            if (controls.pads.includes(padNumber)) {
                return true;
            }
        }
        return false;
    },

    updatePadVisuals() {
        for (let i = 1; i <= 64; i++) {
            this.updatePadVisual(i);
        }
    },

    // ===== MIDI =====
    sendMIDIColor(padNumber, color) {
        if (!App.isConnected() || typeof MIDI === 'undefined') return;
        
        const midiNote = padNumber - 1;
        const colorMap = { green: 'GREEN', red: 'RED', yellow: 'YELLOW' };
        MIDI.setPadColor(midiNote, colorMap[color] || 'OFF');
    },

    syncToMIDI() {
        if (!App.isConnected()) return;
        
        for (let i = 1; i <= 64; i++) {
            const color = this.padConfigs[i].color;
            if (color) {
                this.sendMIDIColor(i, color);
            }
        }
    },

    handleMIDIPreview(message) {
        const { status, note, velocity } = message;
        
        if (velocity > 0) {
            const padNumber = note + 1;
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad) {
                pad.style.transform = 'scale(0.95)';
                setTimeout(() => pad.style.transform = '', 100);
            }
        }
    },

    // ===== CONFIGURATION =====
    saveConfig() {
        App.updateConfig('pads', {
            padConfigs: this.padConfigs,
            sequencerEnabled: this.sequencerEnabled
        });
    },

    loadConfig(config) {
        if (config.pads?.padConfigs) {
            this.padConfigs = { ...this.padConfigs, ...config.pads.padConfigs };
        }
        if (config.pads?.sequencerEnabled !== undefined) {
            this.sequencerEnabled = config.pads.sequencerEnabled;
        }
        
        this.updatePadVisuals();
        
        if (this.currentMode === 'groups') {
            this.updateSequencerOption();
        }
    },

    deselectAll() {
        this.selectedPad = null;
        this.selectedGroup = null;
        
        if (this.currentMode === 'individual') {
            this.showPadModeInterface();
        } else {
            this.showGroupModeInterface();
        }
        
        this.updatePadVisuals();
    }
};

window.addEventListener('config-changed', (event) => {
    if (event.detail.pads) {
        Pads.loadConfig(event.detail);
    }
});