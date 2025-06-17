
const Buttons = {
    
    // ===== ÉTAT ===== //
    currentMode: 'normal', // 'normal' | 'shift'
    selectedButton: null,
    buttonConfigs: {},
    isInitialized: false,
    
    // ===== ACTIONS DISPONIBLES ===== //
    actions: {
        transport: {
            title: 'Transport',
            items: {
                'play_stop': 'Play / Stop',
                'stop': 'Stop',
                'record': 'Record',
                'metronome_on': 'Metronome ON',
                'metronome_off': 'Metronome OFF'
            }
        },
        session: {
            title: 'Session',
            items: {
                'new_clip_8bars': 'New Clip 8 bars',
                'play_clip': 'Play Clip',
                'stop_clip': 'Stop Clip', 
                'launch_scene_1': 'Launch Scene 1',
                'stop_all': 'Stop All Clips'
            }
        },
        devices: {
            title: 'Devices',
            items: {
                'loop_auto': 'Loop Auto Record',
                'overdub_loop': 'Overdub Loop',
                'tempo_up_20': 'Tempo +20',
                'tempo_down_20': 'Tempo -20',
                'quantize_clip': 'Quantize Clip'
            }
        }
    },

    // ===== INITIALISATION ===== //
    init() {
        if (this.isInitialized) return;
        
        this.initButtonConfigs();
        this.createInterface();
        this.setupEventListeners();
        this.updateInterface();
        this.isInitialized = true;
        
        App.log('✅ Module Buttons initialisé', 'info');
    },

    initButtonConfigs() {
        // Configuration par défaut des 8 boutons
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            this.buttonConfigs[buttonId] = {
                normal: '',
                shift: ''
            };
        }
        
        // Configuration par défaut
        this.buttonConfigs[82] = { normal: 'play_stop', shift: 'stop' };
        this.buttonConfigs[83] = { normal: 'record', shift: 'stop' };
        this.buttonConfigs[84] = { normal: 'metronome_on', shift: 'metronome_off' };
        this.buttonConfigs[85] = { normal: 'new_clip_8bars', shift: 'quantize_clip' };
        this.buttonConfigs[86] = { normal: 'play_clip', shift: 'stop_clip' };
        this.buttonConfigs[87] = { normal: 'loop_auto', shift: 'overdub_loop' };
        this.buttonConfigs[88] = { normal: 'tempo_up_20', shift: 'tempo_down_20' };
        this.buttonConfigs[89] = { normal: 'launch_scene_1', shift: 'stop_all' };
    },

    // ===== INTERFACE ===== //
    createInterface() {
        const container = document.querySelector('.buttons-content');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Section Boutons APC -->
            <div class="apc-buttons-section">
                <h3 class="apc-buttons-title">Boutons APC Mini (82-89)</h3>
                <div class="apc-buttons-grid" id="apcButtonsGrid">
                    <!-- Généré par createAPCButtons() -->
                </div>
            </div>
            
            <!-- Section Actions -->
            <div class="actions-section">
                <h3 class="actions-title">Actions Disponibles</h3>
                <div class="actions-grid" id="actionsGrid">
                    <!-- Généré par createActionsGrid() -->
                </div>
                
                <div class="instructions">
                    <div class="instructions-title">Instructions</div>
                    <ul class="instructions-list">
                        <li>Sélectionnez un bouton APC (82-89)</li>
                        <li>Choisissez une action dans les colonnes</li>
                        <li>Toggle Normal/Shift pour 16 actions</li>
                        <li>Configuration sauvegardée automatiquement</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.createAPCButtons();
        this.createActionsGrid();
    },

    createAPCButtons() {
        const grid = document.getElementById('apcButtonsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            const button = document.createElement('div');
            button.className = 'apc-button';
            button.dataset.buttonId = buttonId;
            button.dataset.mode = this.currentMode;
            
            const config = this.buttonConfigs[buttonId];
            const actionKey = config[this.currentMode];
            const actionName = this.getActionName(actionKey);
            
            button.innerHTML = `
                <div class="mode-indicator"></div>
                <div class="button-number">${buttonId}</div>
                <div class="button-label">Bouton ${buttonId}</div>
                <div class="button-action ${actionKey ? '' : 'empty'}">
                    ${actionName || 'Non assigné'}
                </div>
            `;
            
            // Events
            button.addEventListener('click', () => this.selectButton(buttonId));
            
            // Marquer comme configuré si au moins une action
            if (config.normal || config.shift) {
                button.classList.add('configured');
            }
            
            grid.appendChild(button);
        }
    },

    createActionsGrid() {
        const grid = document.getElementById('actionsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.entries(this.actions).forEach(([categoryKey, category]) => {
            const column = document.createElement('div');
            column.className = 'action-column';
            
            column.innerHTML = `
                <div class="column-title">${category.title}</div>
                ${Object.entries(category.items).map(([actionKey, actionName]) => `
                    <div class="action-item" 
                         data-action="${actionKey}"
                         title="${actionName}">
                        ${actionName}
                    </div>
                `).join('')}
            `;
            
            grid.appendChild(column);
        });
        
        // Event listeners actions
        grid.querySelectorAll('.action-item').forEach(item => {
            item.addEventListener('click', () => {
                const actionKey = item.dataset.action;
                this.assignAction(actionKey);
            });
        });
    },

    // ===== SÉLECTION ===== //
    selectButton(buttonId) {
        // Désélectionner ancien
        this.deselectButton();
        
        // Sélectionner nouveau
        this.selectedButton = buttonId;
        const button = this.getButtonElement(buttonId);
        if (button) {
            button.classList.add('selected');
        }
        
        this.updateActionsState();
        
        App.log(`🎯 Bouton ${buttonId} sélectionné (mode ${this.currentMode})`, 'info');
    },

    deselectButton() {
        if (this.selectedButton) {
            const button = this.getButtonElement(this.selectedButton);
            if (button) {
                button.classList.remove('selected');
            }
            this.selectedButton = null;
        }
        
        this.updateActionsState();
    },

    deselectAll() {
        this.deselectButton();
    },

    // ===== MODE NORMAL/SHIFT ===== //
    setupEventListeners() {
        // Toggle Normal/Shift
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode) {
                    this.switchMode(mode);
                }
            });
        });
    },

    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        
        // UI toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // UI content mode
        const content = document.querySelector('.buttons-content');
        if (content) {
            if (mode === 'shift') {
                content.classList.add('shift-mode');
            } else {
                content.classList.remove('shift-mode');
            }
        }
        
        // Mettre à jour boutons APC
        this.updateAPCButtons();
        this.updateActionsState();
        
        App.log(`🔄 Mode ${mode.toUpperCase()} activé`, 'info');
    },

    updateAPCButtons() {
        document.querySelectorAll('.apc-button').forEach(button => {
            const buttonId = parseInt(button.dataset.buttonId);
            button.dataset.mode = this.currentMode;
            
            const config = this.buttonConfigs[buttonId];
            const actionKey = config[this.currentMode];
            const actionName = this.getActionName(actionKey);
            
            const actionEl = button.querySelector('.button-action');
            if (actionEl) {
                actionEl.textContent = actionName || 'Non assigné';
                actionEl.className = `button-action ${actionKey ? '' : 'empty'}`;
            }
        });
    },

    // ===== ASSIGNATION ACTIONS ===== //
    assignAction(actionKey) {
        if (!this.selectedButton) {
            this.showFeedback('⚠️ Sélectionnez d\'abord un bouton');
            return;
        }
        
        // Vérifier si action déjà assignée
        const conflict = this.findActionConflict(actionKey);
        if (conflict) {
            this.showFeedback(`⚠️ Action déjà assignée au bouton ${conflict}`);
            return;
        }
        
        // Assigner action
        this.buttonConfigs[this.selectedButton][this.currentMode] = actionKey;
        
        // Mettre à jour interface
        this.updateAPCButtons();
        this.updateActionsState();
        this.saveConfig();
        
        const actionName = this.getActionName(actionKey);
        this.showFeedback(`✅ Bouton ${this.selectedButton} → ${actionName}`);
        
        App.log(`🔗 Bouton ${this.selectedButton} (${this.currentMode}) → ${actionName}`, 'success');
        
        // Désélectionner pour prochaine assignation
        this.deselectButton();
    },

    findActionConflict(actionKey) {
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            const config = this.buttonConfigs[buttonId];
            if (config[this.currentMode] === actionKey) {
                return buttonId;
            }
        }
        return null;
    },

    updateActionsState() {
        document.querySelectorAll('.action-item').forEach(item => {
            const actionKey = item.dataset.action;
            item.classList.remove('selected', 'disabled');
            
            // Marquer action du bouton sélectionné
            if (this.selectedButton) {
                const currentAction = this.buttonConfigs[this.selectedButton][this.currentMode];
                if (currentAction === actionKey) {
                    item.classList.add('selected');
                }
            }
            
            // Griser actions déjà assignées
            const conflict = this.findActionConflict(actionKey);
            if (conflict && conflict !== this.selectedButton) {
                item.classList.add('disabled');
            }
        });
    },

    // ===== UTILITAIRES ===== //
    getActionName(actionKey) {
        if (!actionKey) return '';
        
        for (const category of Object.values(this.actions)) {
            if (category.items[actionKey]) {
                return category.items[actionKey];
            }
        }
        return actionKey;
    },

    getButtonElement(buttonId) {
        return document.querySelector(`[data-button-id="${buttonId}"]`);
    },

    showFeedback(message) {
        // Supprimer ancien feedback
        const existing = document.querySelector('.assignment-feedback');
        if (existing) existing.remove();
        
        // Créer nouveau feedback
        const feedback = document.createElement('div');
        feedback.className = 'assignment-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        // Supprimer après 2 secondes
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    },

    // ===== INTERFACE PUBLIQUE ===== //
    updateInterface() {
        this.updateAPCButtons();
        this.updateActionsState();
    },

    clearButton(buttonId) {
        this.buttonConfigs[buttonId] = { normal: '', shift: '' };
        this.updateInterface();
        this.saveConfig();
        
        App.log(`🧹 Bouton ${buttonId} effacé`, 'info');
    },

    clearAll() {
        for (let buttonId = 82; buttonId <= 89; buttonId++) {
            this.buttonConfigs[buttonId] = { normal: '', shift: '' };
        }
        
        this.updateInterface();
        this.saveConfig();
        
        App.log('🧹 Tous les boutons effacés', 'info');
    },

    resetToDefault() {
        this.initButtonConfigs();
        this.updateInterface();
        this.saveConfig();
        
        App.log('🔄 Configuration boutons réinitialisée', 'info');
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

    // ===== PREVIEW MIDI ===== //
    handleMIDIPreview(message) {
        const { status, note, velocity } = message;
        
        // Boutons 82-89
        if (note >= 82 && note <= 89 && velocity > 0) {
            const button = this.getButtonElement(note);
            if (button) {
                button.classList.add('midi-feedback');
                setTimeout(() => {
                    button.classList.remove('midi-feedback');
                }, 200);
            }
            
            App.log(`🎹 Bouton ${note} pressé`, 'info');
        }
        
        // Shift (note 98)
        if (note === 98) {
            const isPressed = velocity > 0;
            App.log(`⇧ Shift ${isPressed ? 'pressé' : 'relâché'}`, 'info');
        }
    }
};

// ===== EVENT LISTENERS ===== //
window.addEventListener('config-changed', (event) => {
    if (event.detail.buttons) {
        Buttons.loadConfig(event.detail);
    }
});