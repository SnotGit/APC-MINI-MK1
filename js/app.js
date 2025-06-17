const App = {
    
    // ===== ÉTAT GLOBAL ===== 
    state: {
        currentView: 'pads',
        midiConnected: false,
        config: {
            pads: {},
            buttons: {
                82: { normal: 'play_stop', shift: 'stop' },
                83: { normal: 'record', shift: 'stop' },
                84: { normal: 'metronome_on', shift: 'metronome_off' },
                85: { normal: 'new_clip_8bars', shift: 'quantize_clip' },
                86: { normal: 'play_clip', shift: 'stop_clip' },
                87: { normal: 'loop_auto', shift: 'overdub_loop' },
                88: { normal: 'tempo_up_20', shift: 'tempo_down_20' },
                89: { normal: 'launch_scene_1', shift: 'stop_all' }
            },
            sequencer: {
                scale: 'C_Major',
                octave: 3,
                steps: [],
                playhead: 0,
                isPlaying: false
            }
        }
    },

    // ===== INITIALISATION ===== 
    init() {
        this.log('Interface APC Mini MK1 chargée', 'system');
        
        this.setupNavigation();
        this.setupMIDI();
        this.loadConfig();
        this.initModules();
        
        this.log('Interface prête', 'success');
    },

    // ===== NAVIGATION BOUTONS ===== 
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewId = button.dataset.view;
                this.switchView(viewId);
            });
        });
    },

    switchView(viewId) {
        if (this.state.currentView === viewId) return;
        
        this.state.currentView = viewId;
        
        // Mettre à jour boutons navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mettre à jour vues
        document.querySelectorAll('.view-panel').forEach(panel => {
            if (panel.id === `view-${viewId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Initialiser module si nécessaire
        this.initViewModule(viewId);
        
        this.log(`Vue ${viewId.toUpperCase()} activée`, 'info');
    },

    initViewModule(viewId) {
        switch(viewId) {
            case 'pads':
                if (typeof Pads !== 'undefined') Pads.init();
                break;
            case 'buttons':
                if (typeof Buttons !== 'undefined') Buttons.init();
                break;
            case 'sequencer':
                if (typeof Sequencer !== 'undefined') Sequencer.init();
                break;
            case 'export':
                if (typeof Export !== 'undefined') Export.init();
                break;
        }
    },

    // ===== CONNEXION MIDI ===== 
    setupMIDI() {
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.connectMIDI();
            });
        }
    },

    async connectMIDI() {
        this.log('Tentative de connexion MIDI...', 'info');
        
        if (typeof MIDI === 'undefined') {
            this.log('Module MIDI non disponible', 'error');
            return false;
        }
        
        const success = await MIDI.connect();
        this.state.midiConnected = success;
        
        const connectBtn = document.getElementById('connectBtn');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (success) {
            if (connectBtn) {
                connectBtn.textContent = 'CONNECTÉ';
                connectBtn.classList.add('connected');
            }
            
            if (statusDot) statusDot.classList.add('connected');
            if (statusText) statusText.textContent = 'Connecté';
            
            this.log('APC Mini connecté avec succès', 'success');
            this.syncMIDI();
            
        } else {
            if (connectBtn) {
                connectBtn.textContent = 'ÉCHEC';
                setTimeout(() => {
                    connectBtn.textContent = 'CONNEXION';
                }, 2000);
            }
            
            this.log('Connexion APC Mini échouée', 'error');
        }
        
        return success;
    },

    syncMIDI() {
        if (typeof Pads !== 'undefined') {
            Pads.syncToMIDI();
        }
        
        this.log('Preview MIDI synchronisé', 'info');
    },

    // ===== INITIALISATION MODULES ===== 
    initModules() {
        const modules = ['MIDI', 'Pads', 'Buttons', 'Sequencer', 'Export'];
        
        modules.forEach(moduleName => {
            if (typeof window[moduleName] !== 'undefined') {
                if (window[moduleName].init) {
                    try {
                        window[moduleName].init();
                        this.log(`Module ${moduleName} initialisé`, 'info');
                    } catch (error) {
                        this.log(`Erreur module ${moduleName}: ${error.message}`, 'error');
                    }
                }
            }
        });
        
        this.initViewModule(this.state.currentView);
    },

    // ===== LOGGING ===== 
    log(message, type = 'info') {
        const console = document.getElementById('console');
        if (!console) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        
        console.appendChild(entry);
        console.scrollTop = console.scrollHeight;
        
        // Limiter à 100 entrées
        while (console.children.length > 100) {
            console.removeChild(console.firstChild);
        }
    },

    clearConsole() {
        const console = document.getElementById('console');
        if (console) {
            console.innerHTML = '';
            this.log('Console effacée', 'system');
        }
    },

    // ===== CONFIGURATION ===== 
    loadConfig() {
        try {
            const saved = localStorage.getItem('apcMiniMK1Config');
            if (saved) {
                const config = JSON.parse(saved);
                this.state.config = { ...this.state.config, ...config };
                this.log('Configuration chargée', 'info');
            }
        } catch (error) {
            this.log(`Erreur chargement config: ${error.message}`, 'error');
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apcMiniMK1Config', JSON.stringify(this.state.config));
            this.log('Configuration sauvegardée', 'info');
        } catch (error) {
            this.log(`Erreur sauvegarde config: ${error.message}`, 'error');
        }
    },

    updateConfig(section, data) {
        if (this.state.config[section]) {
            this.state.config[section] = { ...this.state.config[section], ...data };
        } else {
            this.state.config[section] = data;
        }
        
        this.saveConfig();
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

    // ===== CLEANUP ===== 
    destroy() {
        this.saveConfig();
        
        if (this.state.midiConnected && typeof MIDI !== 'undefined') {
            MIDI.disconnect();
        }
        
        this.log('Application fermée', 'system');
    }
};

// ===== EVENT LISTENERS GLOBAUX ===== 
window.addEventListener('beforeunload', () => {
    App.destroy();
});

document.addEventListener('keydown', (event) => {
    // Ctrl+S : Sauvegarder
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        App.saveConfig();
    }
    
    // Échap : Désélectionner
    if (event.key === 'Escape') {
        const currentView = App.getCurrentView();
        
        if (currentView === 'pads' && typeof Pads !== 'undefined') {
            Pads.deselectAll();
        } else if (currentView === 'buttons' && typeof Buttons !== 'undefined') {
            Buttons.deselectAll();
        }
    }
    
    // Touches 1-5 : Changer de vue
    if (event.key >= '1' && event.key <= '5' && !event.ctrlKey && !event.altKey) {
        const views = ['pads', 'buttons', 'sequencer', 'connexion', 'export'];
        const viewIndex = parseInt(event.key) - 1;
        if (views[viewIndex]) {
            App.switchView(views[viewIndex]);
        }
    }
});