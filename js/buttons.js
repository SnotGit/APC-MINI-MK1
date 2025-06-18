const Buttons = {
    
    // ===== ÉTAT ===== //
    selectedButton: null,
    shiftMode: false,
    buttonConfigs: {},
    isInitialized: false,
    
    // ===== 16 COULEURS FLASHY ===== //
    colors: [
        '#ce0000', '#00ce00', '#0000ce', '#ce00ce', 
        '#cece00', '#00cece', '#ff6600', '#6600ff',
        '#ff0066', '#66ff00', '#0066ff', '#ff6666',
        '#66ff66', '#6666ff', '#ffff66', '#ff66ff'
    ],
    
    // ===== 16 ACTIONS ===== //
    actions: {
        normal: [
            { id: 'play_stop', name: 'Play/Stop' },
            { id: 'record', name: 'Record' },
            { id: 'metronome_on', name: 'Metronome ON' },
            { id: 'new_clip_8bars', name: 'New Clip 8 bars' },
            { id: 'play_clip', name: 'Play Clip' },
            { id: 'loop_auto', name: 'Loop Auto' },
            { id: 'tempo_up_20', name: 'Tempo +20' },
            { id: 'launch_scene_1', name: 'Launch Scene 1' }
        ],
        shift: [
            { id: 'stop', name: 'Stop' },
            { id: 'stop_alt', name: 'Stop' },
            { id: 'metronome_off', name: 'Metronome OFF' },
            { id: 'quantize_clip', name: 'Quantize Clip' },
            { id: 'stop_clip', name: 'Stop Clip' },
            { id: 'overdub_loop', name: 'Overdub Loop' },
            { id: 'tempo_down_20', name: 'Tempo -20' },
            { id: 'stop_all', name: 'Stop All' }
        ]
    },

    // ===== INITIALISATION ===== //
    init() {
        if (this.isInitialized) return;
        
        this.initButtonConfigs();
        this.createInterface();
        this.setupEventListeners();
        this.isInitialized = true;
        
        App.log('Module Buttons initialisé', 'success');
    },

    initButtonConfigs() {
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            this.buttonConfigs[buttonId] = {
                normal: null,
                shift: null,
                color: null
            };
        }
    },

    // ===== INTERFACE ===== //
    createInterface() {
        const container = document.querySelector('.buttons-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="buttons-interface">
                <!-- 8 Boutons APC -->
                <div class="apc-buttons-row">
                    ${this.createAPCButtons()}
                    <button class="shift-toggle" id="shiftToggle" onclick="Buttons.toggleShift()">
                        SHIFT
                    </button>
                </div>
                
                <!-- 2 Colonnes Actions -->
                <div class="actions-columns">
                    <div class="actions-column">
                        <h3 class="column-title">NORMAL</h3>
                        <div class="actions-list" id="normalActions">
                            ${this.createActionsList('normal')}
                        </div>
                    </div>
                    
                    <div class="actions-column">
                        <h3 class="column-title">SHIFT</h3>
                        <div class="actions-list" id="shiftActions">
                            ${this.createActionsList('shift')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupActionEvents();
    },

    createAPCButtons() {
        let html = '';
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            html += `
                <button class="apc-button" 
                        data-button="${buttonId}" 
                        onclick="Buttons.selectButton(${buttonId})">
                    ${buttonId}
                </button>
            `;
        }
        return html;
    },

    createActionsList(mode) {
        return this.actions[mode].map((action, index) => `
            <button class="action-button" 
                    data-mode="${mode}" 
                    data-action="${action.id}"
                    data-color="${this.colors[index]}">
                ${action.name}
            </button>
        `).join('');
    },

    setupActionEvents() {
        document.querySelectorAll('.action-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                const actionId = btn.dataset.action;
                const color = btn.dataset.color;
                this.assignAction(actionId, mode, color);
            });
        });
    },

    // ===== SÉLECTION BOUTON ===== //
    selectButton(buttonId) {
        // Désélectionner ancien
        document.querySelectorAll('.apc-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Sélectionner nouveau
        this.selectedButton = buttonId;
        const button = document.querySelector(`[data-button="${buttonId}"]`);
        if (button) {
            button.classList.add('selected');
        }
        
        App.log('Bouton ' + buttonId + ' sélectionné', 'info');
    },

    // ===== ASSIGNATION ACTION ===== //
    assignAction(actionId, mode, color) {
        if (!this.selectedButton) {
            App.log('Sélectionnez d\'abord un bouton', 'warning');
            return;
        }
        
        const config = this.buttonConfigs[this.selectedButton];
        const actionButton = document.querySelector(`[data-action="${actionId}"]`);
        const apcButton = document.querySelector(`[data-button="${this.selectedButton}"]`);
        
        // Si action déjà assignée → clear
        if (config[mode] === actionId) {
            this.clearAssignment(mode, actionId);
            return;
        }
        
        // Clear ancienne assignation si existe
        if (config[mode]) {
            this.clearAssignment(mode, config[mode]);
        }
        
        // Nouvelle assignation
        config[mode] = actionId;
        config.color = color;
        
        // Appliquer couleur
        if (actionButton) {
            actionButton.style.backgroundColor = color;
            actionButton.style.color = '#fff';
            actionButton.classList.add('assigned');
        }
        
        if (apcButton) {
            apcButton.style.backgroundColor = color;
            apcButton.style.color = '#fff';
        }
        
        this.saveConfig();
        
        const actionName = this.getActionName(actionId);
        App.log('Bouton ' + this.selectedButton + ' (' + mode + ') → ' + actionName, 'success');
    },

    clearAssignment(mode, actionId) {
        const config = this.buttonConfigs[this.selectedButton];
        const actionButton = document.querySelector(`[data-action="${actionId}"]`);
        const apcButton = document.querySelector(`[data-button="${this.selectedButton}"]`);
        
        // Clear config
        config[mode] = null;
        if (!config.normal && !config.shift) {
            config.color = null;
        }
        
        // Clear couleurs
        if (actionButton) {
            actionButton.style.backgroundColor = '';
            actionButton.style.color = '';
            actionButton.classList.remove('assigned');
        }
        
        if (apcButton && !config.normal && !config.shift) {
            apcButton.style.backgroundColor = '';
            apcButton.style.color = '';
        }
        
        this.saveConfig();
        
        const actionName = this.getActionName(actionId);
        App.log('Assignation effacée: ' + actionName, 'info');
    },

    // ===== SHIFT TOGGLE ===== //
    toggleShift() {
        this.shiftMode = !this.shiftMode;
        
        const toggle = document.getElementById('shiftToggle');
        if (toggle) {
            if (this.shiftMode) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    },

    // ===== UTILITAIRES ===== //
    getActionName(actionId) {
        for (const mode of ['normal', 'shift']) {
            const action = this.actions[mode].find(a => a.id === actionId);
            if (action) return action.name;
        }
        return actionId;
    },

    updateInterface() {
        // Restaurer les assignations visuelles
        Object.entries(this.buttonConfigs).forEach(([buttonId, config]) => {
            if (config.color) {
                const apcButton = document.querySelector(`[data-button="${buttonId}"]`);
                if (apcButton) {
                    apcButton.style.backgroundColor = config.color;
                    apcButton.style.color = '#fff';
                }
                
                // Restaurer couleurs actions
                ['normal', 'shift'].forEach(mode => {
                    if (config[mode]) {
                        const actionButton = document.querySelector(`[data-action="${config[mode]}"]`);
                        if (actionButton) {
                            actionButton.style.backgroundColor = config.color;
                            actionButton.style.color = '#fff';
                            actionButton.classList.add('assigned');
                        }
                    }
                });
            }
        });
    },

    // ===== PREVIEW MIDI ===== //
    handleMIDIPreview(message) {
        const { status, note, velocity } = message;
        
        // Boutons 82-89
        if (note >= 82 && note <= 89 && velocity > 0) {
            const button = document.querySelector(`[data-button="${note}"]`);
            if (button) {
                button.classList.add('midi-feedback');
                setTimeout(() => {
                    button.classList.remove('midi-feedback');
                }, 200);
            }
            
            App.log('Bouton ' + note + ' pressé', 'info');
        }
        
        // Shift (note 98)
        if (note === 98) {
            const isPressed = velocity > 0;
            if (isPressed) {
                this.toggleShift();
            }
        }
    },

    // ===== CONFIGURATION ===== //
    saveConfig() {
        App.updateConfig('buttons', this.buttonConfigs);
    },

    loadConfig(config) {
        if (config.buttons) {
            this.buttonConfigs = { ...this.buttonConfigs, ...config.buttons };
            
            if (this.isInitialized) {
                this.updateInterface();
            }
        }
    },

    getConfig() {
        return this.buttonConfigs;
    },

    deselectAll() {
        this.selectedButton = null;
        document.querySelectorAll('.apc-button').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
};

// ===== EVENT LISTENERS ===== //
window.addEventListener('config-changed', (event) => {
    if (event.detail.buttons) {
        Buttons.loadConfig(event.detail);
    }
});