const App = {
    
    // ===== ÉTAT GLOBAL ===== 
    state: {
        currentView: 'pads',
        midiConnected: false,
        config: {
            pads: {},
            sequencer: {
                activeGroup: null,
                selectedScale: 'major',
                octaveBase: 0,
                selectedSwing: 50,
                currentMode: 'steps',
                steps: Array(16).fill(false),
                isPlaying: false
            }
        }
    },

    // ===== GESTION ÉTAT SÉQUENCEUR CENTRALISÉE =====
    updateSequencerState(updates) {
        this.state.config.sequencer = { 
            ...this.state.config.sequencer, 
            ...updates 
        };
        this.saveConfig();
        this.broadcastConfigChange();
    },
    
    getSequencerState() {
        return this.state.config.sequencer;
    },
    
    activateSequencerGroup(groupId) {
        this.updateSequencerState({ activeGroup: groupId });
        
        if (this.state.currentView === 'sequencer' && typeof Sequencer !== 'undefined') {
            Sequencer.setActiveGroup(groupId);
        }
    },
    
    deactivateSequencer() {
        this.updateSequencerState({ activeGroup: null });
        
        if (typeof Sequencer !== 'undefined') {
            Sequencer.setActiveGroup(null);
        }
    },

    // ===== INITIALISATION ===== 
    init() {
        this.setupNavigation();
        this.loadConfig();
        this.initModules();
        this.autoConnectMIDI();
    },

    // ===== NAVIGATION ===== 
    setupNavigation() {
        const navButtons = document.querySelectorAll('.header-btn[data-view]');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewId = button.dataset.view;
                this.switchView(viewId);
            });
        });
    },

    switchView(viewId) {
        if (this.state.currentView === viewId) return;
        
        // Nettoyer la vue précédente
        this.cleanupCurrentView();
        
        this.state.currentView = viewId;
        
        // Mettre à jour boutons navigation
        document.querySelectorAll('.header-btn[data-view]').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mettre à jour vues
        document.querySelectorAll('.view-content').forEach(panel => {
            if (panel.id === `view-${viewId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Initialiser module si nécessaire
        this.initViewModule(viewId);
        
        // Mettre à jour le config panel dynamiquement
        this.updateConfigPanel(viewId);
    },

    // ===== GESTION CONFIG PANEL DYNAMIQUE =====
    updateConfigPanel(viewId) {
        this.toggleModeSelector(viewId === 'pads');
        
        switch(viewId) {
            case 'pads':
                if (typeof Pads !== 'undefined' && Pads.showCurrentInterface) {
                    Pads.showCurrentInterface();
                }
                break;
            case 'sequencer':
                if (typeof Sequencer !== 'undefined' && Sequencer.showConfigInterface) {
                    Sequencer.showConfigInterface();
                }
                break;
            case 'export':
                if (typeof Export !== 'undefined' && Export.showConfigInterface) {
                    Export.showConfigInterface();
                }
                break;
        }
    },
    
    cleanupCurrentView() {
        // Nettoyer la vue précédente si nécessaire
        switch(this.state.currentView) {
            case 'sequencer':
                if (typeof Sequencer !== 'undefined' && Sequencer.cleanup) {
                    Sequencer.cleanup();
                }
                break;
        }
    },
    
    toggleModeSelector(show) {
        const modeSelector = document.querySelector('.config-mode-selector');
        if (modeSelector) {
            modeSelector.style.display = show ? 'flex' : 'none';
        }
    },

    initViewModule(viewId) {
        switch(viewId) {
            case 'pads':
                if (typeof Pads !== 'undefined' && !Pads.isInitialized) {
                    Pads.init();
                }
                break;
            case 'sequencer':
                if (typeof Sequencer !== 'undefined' && !Sequencer.isInitialized) {
                    Sequencer.init();
                } else if (typeof Sequencer !== 'undefined' && Sequencer.isInitialized) {
                    // Réactiver le séquenceur si déjà initialisé
                    Sequencer.activate();
                }
                break;
            case 'export':
                if (typeof Export !== 'undefined' && !Export.isInitialized) {
                    Export.init();
                }
                break;
        }
    },

    // ===== CONNEXION MIDI AUTOMATIQUE ===== 
    async autoConnectMIDI() {
        try {
            if (typeof MIDI === 'undefined') {
                throw new Error('Module MIDI non disponible');
            }
            
            const success = await MIDI.connect();
            this.updateConnectionStatus(success);
            
            if (success) {
                this.log('APC Mini connecté', 'success');
                this.setupMIDIListeners();
                this.syncMIDI();
            }
            
        } catch (error) {
            this.updateConnectionStatus(false);
            this.log('Erreur connexion: ' + error.message, 'error');
        }
    },

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        this.state.midiConnected = connected;
        
        if (connected) {
            statusElement.textContent = 'Connecté';
            statusElement.style.backgroundColor = '#4a6a4a';
            statusElement.style.borderColor = '#5a7a5a';
            statusElement.style.color = '#e0e0e0';
        } else {
            statusElement.textContent = 'Déconnecté';
            statusElement.style.backgroundColor = '#5a4a4a';
            statusElement.style.borderColor = '#6a5555';
            statusElement.style.color = '#e0e0e0';
        }
    },

    setupMIDIListeners() {
        window.addEventListener('midi-message', (event) => {
            const { status, note, velocity } = event.detail;
            
            switch(this.state.currentView) {
                case 'pads':
                    if (typeof Pads !== 'undefined' && Pads.handleMIDIPreview) {
                        Pads.handleMIDIPreview(event.detail);
                    }
                    break;
                case 'sequencer':
                    if (typeof Sequencer !== 'undefined' && Sequencer.handleMIDIPreview) {
                        Sequencer.handleMIDIPreview(event.detail);
                    }
                    break;
            }
        });
        
        window.addEventListener('sequencer-group-activated', (event) => {
            this.activateSequencerGroup(event.detail.groupId);
        });
        
        window.addEventListener('sequencer-deactivated', () => {
            this.deactivateSequencer();
        });
    },

    syncMIDI() {
        // Synchroniser tous les modules avec l'APC Mini
        if (typeof Pads !== 'undefined' && Pads.syncToMIDI) {
            Pads.syncToMIDI();
        }
        
        if (typeof Sequencer !== 'undefined' && Sequencer.syncToMIDI) {
            Sequencer.syncToMIDI();
        }
    },

    disconnectMIDI() {
        if (typeof MIDI !== 'undefined') {
            MIDI.disconnect();
        }
        
        this.updateConnectionStatus(false);
        this.log('APC Mini déconnecté', 'info');
    },

    // ===== EXPORT AVEC DÉCONNEXION ===== 
    async exportConfig() {
        // Déconnecter automatiquement l'APC Mini
        this.disconnectMIDI();
        
        // Lancer l'export
        if (typeof Export !== 'undefined' && Export.generateScript) {
            await Export.generateScript();
        }
    },

    // ===== INITIALISATION MODULES =====
    initModules() {
        const modules = [
            { name: 'MIDI', obj: window.MIDI },
            { name: 'Pads', obj: window.Pads },
            { name: 'Sequencer', obj: window.Sequencer },
            { name: 'Export', obj: window.Export }
        ];
        
        modules.forEach(({ name, obj }) => {
            if (obj && typeof obj.init === 'function') {
                try {
                    if (!['Pads', 'Sequencer', 'Export'].includes(name)) {
                        obj.init();
                    }
                } catch (error) {
                    this.log('Erreur module ' + name + ': ' + error.message, 'error');
                }
            }
        });
        
        this.initViewModule(this.state.currentView);
        this.updateConfigPanel(this.state.currentView);
    },

    // ===== LOGGING ===== 
    log(message, type = 'info') {
        const console = document.getElementById('console');
        if (!console) {
            window.console.log('[' + type.toUpperCase() + '] ' + message);
            return;
        }
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        
        entry.innerHTML = '<span class="timestamp">[' + timestamp + ']</span> ' + message;
        
        console.appendChild(entry);
        console.scrollTop = console.scrollHeight;
        
        // Limiter à 50 entrées pour les performances
        while (console.children.length > 50) {
            console.removeChild(console.firstChild);
        }
    },

    clearConsole() {
        const console = document.getElementById('console');
        if (console) {
            console.innerHTML = '';
        }
    },

    // ===== CONFIGURATION ===== 
    loadConfig() {
        try {
            const saved = localStorage.getItem('apcMiniMK1Config');
            if (saved) {
                const config = JSON.parse(saved);
                this.state.config = this.mergeConfig(this.state.config, config);
                
                // Notifier les modules
                this.broadcastConfigChange();
            }
        } catch (error) {
            this.log('Erreur chargement config: ' + error.message, 'error');
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apcMiniMK1Config', JSON.stringify(this.state.config));
        } catch (error) {
            this.log('Erreur sauvegarde config: ' + error.message, 'error');
        }
    },

    updateConfig(section, data) {
        if (!this.state.config[section]) {
            this.state.config[section] = {};
        }
        
        this.state.config[section] = { ...this.state.config[section], ...data };
        this.saveConfig();
        this.broadcastConfigChange();
    },

    mergeConfig(base, update) {
        const result = { ...base };
        
        for (const [key, value] of Object.entries(update)) {
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                result[key] = this.mergeConfig(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    },

    broadcastConfigChange() {
        window.dispatchEvent(new CustomEvent('config-changed', {
            detail: this.state.config
        }));
    },

    // ===== GETTERS ===== 
    isConnected() {
        return this.state.midiConnected;
    },

    getConfig(section = null) {
        return section ? this.state.config[section] : this.state.config;
    },

    getCurrentView() {
        return this.state.currentView;
    },
    
    // ===== UTILITAIRES CONFIG PANEL =====
    clearConfigPanel() {
        const configPanel = document.getElementById('configContent');
        if (configPanel) {
            configPanel.innerHTML = '<div class="placeholder-text">Sélectionnez un élément pour le configurer</div>';
        }
    },
    
    setConfigPanelContent(content) {
        const configPanel = document.getElementById('configContent');
        if (configPanel) {
            configPanel.innerHTML = content;
        }
    },

    // ===== CLEANUP ===== 
    destroy() {
        this.saveConfig();
        
        if (this.state.midiConnected) {
            this.disconnectMIDI();
        }
    }
};

// ===== EVENT LISTENERS GLOBAUX ===== 
window.addEventListener('beforeunload', () => {
    App.destroy();
});

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        App.saveConfig();
    }
    
    if (event.key === 'Escape') {
        const currentView = App.getCurrentView();
        
        switch(currentView) {
            case 'pads':
                if (typeof Pads !== 'undefined' && Pads.deselectAll) {
                    Pads.deselectAll();
                }
                break;
            case 'sequencer':
                if (typeof Sequencer !== 'undefined' && Sequencer.deselectAll) {
                    Sequencer.deselectAll();
                }
                break;
        }
    }
    
    if (event.key >= '1' && event.key <= '3' && !event.ctrlKey && !event.altKey) {
        const views = ['pads', 'sequencer', 'export'];
        const viewIndex = parseInt(event.key) - 1;
        if (views[viewIndex]) {
            App.switchView(views[viewIndex]);
        }
    }
});