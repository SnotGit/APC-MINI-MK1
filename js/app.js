
const App = {
    
    // ===== ÉTAT GLOBAL ===== //
    state: {
        currentTab: 'pads',
        midiConnected: false,
        config: {
            pads: {},
            buttons: {
                // Configuration par défaut
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

    // ===== INITIALISATION ===== //
    init() {
        this.log('🚀 Initialisation APC Mini MK1 Configurator', 'system');
        
        this.setupNavigation();
        this.setupMIDI();
        this.loadConfig();
        this.initModules();
        
        this.log('✅ Interface prête', 'success');
    },

    // ===== NAVIGATION ONGLETS ===== //
    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    },

    switchTab(tabId) {
        if (this.state.currentTab === tabId) return;
        
        // Mettre à jour l'état
        this.state.currentTab = tabId;
        
        // Mettre à jour navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mettre à jour panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Initialiser module si nécessaire
        this.initTabModule(tabId);
        
        this.log(`📄 Onglet ${tabId.toUpperCase()} activé`, 'info');
    },

    initTabModule(tabId) {
        switch(tabId) {
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

    // ===== CONNEXION MIDI ===== //
    setupMIDI() {
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.connectMIDI();
            });
        }
    },

    async connectMIDI() {
        this.log('🔌 Tentative de connexion MIDI...', 'info');
        
        if (typeof MIDI === 'undefined') {
            this.log('❌ Module MIDI non disponible', 'error');
            return false;
        }
        
        const success = await MIDI.connect();
        this.state.midiConnected = success;
        
        const connectBtn = document.getElementById('connectBtn');
        const midiStatus = document.getElementById('midiStatus');
        
        if (success) {
            // Interface connectée
            if (connectBtn) {
                connectBtn.textContent = 'CONNECTÉ';
                connectBtn.classList.add('connected');
            }
            
            if (midiStatus) {
                midiStatus.classList.add('connected');
                midiStatus.querySelector('.status-text').textContent = 'Connecté';
            }
            
            this.log('✅ APC Mini connecté avec succès', 'success');
            
            // Synchroniser modules
            this.syncMIDI();
            
        } else {
            // Échec connexion
            if (connectBtn) {
                connectBtn.textContent = 'ÉCHEC';
                connectBtn.classList.add('error');
                
                setTimeout(() => {
                    connectBtn.textContent = 'CONNEXION';
                    connectBtn.classList.remove('error');
                }, 2000);
            }
            
            this.log('❌ Connexion APC Mini échouée', 'error');
        }
        
        return success;
    },

    // ===== SYNCHRONISATION MIDI (Preview uniquement) ===== //
    syncMIDI() {
        // Juste synchroniser pour preview visuel
        if (typeof Pads !== 'undefined') {
            Pads.syncToMIDI();
        }
        
        this.log('🔄 Preview MIDI synchronisé', 'info');
    },

    // ===== INITIALISATION MODULES ===== //
    initModules() {
        // Initialiser tous les modules
        const modules = ['MIDI', 'Pads', 'Buttons', 'Sequencer', 'Export'];
        
        modules.forEach(moduleName => {
            if (typeof window[moduleName] !== 'undefined') {
                if (window[moduleName].init) {
                    try {
                        window[moduleName].init();
                        this.log(`✅ Module ${moduleName} initialisé`, 'info');
                    } catch (error) {
                        this.log(`❌ Erreur module ${moduleName}: ${error.message}`, 'error');
                    }
                }
            } else {
                this.log(`⚠️ Module ${moduleName} non trouvé`, 'warning');
            }
        });
        
        // Initialiser l'onglet actuel
        this.initTabModule(this.state.currentTab);
    },

    // ===== LOGGING ===== //
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
        
        // Log aussi dans la console navigateur
        const logMethods = {
            'system': 'log',
            'info': 'log',
            'success': 'log',
            'warning': 'warn',
            'error': 'error'
        };
        
        console[logMethods[type] || 'log'](`[${type.toUpperCase()}] ${message}`);
    },

    clearConsole() {
        const console = document.getElementById('console');
        if (console) {
            console.innerHTML = '';
            this.log('🧹 Console effacée', 'system');
        }
    },

    // ===== CONFIGURATION ===== //
    loadConfig() {
        try {
            const saved = localStorage.getItem('apcMiniMK1Config');
            if (saved) {
                const config = JSON.parse(saved);
                this.state.config = { ...this.state.config, ...config };
                this.log('📥 Configuration chargée', 'info');
                
                // Notifier les modules
                this.broadcastConfigChange();
            }
        } catch (error) {
            this.log(`❌ Erreur chargement config: ${error.message}`, 'error');
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apcMiniMK1Config', JSON.stringify(this.state.config));
            this.log('💾 Configuration sauvegardée', 'info');
        } catch (error) {
            this.log(`❌ Erreur sauvegarde config: ${error.message}`, 'error');
        }
    },

    updateConfig(section, data) {
        if (this.state.config[section]) {
            this.state.config[section] = { ...this.state.config[section], ...data };
        } else {
            this.state.config[section] = data;
        }
        
        this.saveConfig();
        this.broadcastConfigChange();
    },

    broadcastConfigChange() {
        const event = new CustomEvent('config-changed', {
            detail: this.state.config
        });
        window.dispatchEvent(event);
    },

    // ===== GETTERS ===== //
    isConnected() {
        return this.state.midiConnected;
    },

    getConfig(section = null) {
        return section ? this.state.config[section] : this.state.config;
    },

    getCurrentTab() {
        return this.state.currentTab;
    },

    // ===== PREVIEW MIDI (Web uniquement) ===== //
    handleMIDIPreview(message) {
        // Juste pour preview dans l'interface web
        const { status, note, velocity } = message;
        
        // Feedback visuel pads
        if (note >= 0 && note <= 63 && typeof Pads !== 'undefined') {
            Pads.handleMIDIPreview(message);
        }
        
        // Log pour debug
        this.log(`🎹 MIDI Preview: Note ${note}, Vel ${velocity}`, 'info');
    },

    // ===== UTILITAIRES ===== //
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // ===== CLEANUP ===== //
    destroy() {
        // Sauvegarder avant fermeture
        this.saveConfig();
        
        // Déconnecter MIDI
        if (this.state.midiConnected && typeof MIDI !== 'undefined') {
            MIDI.disconnect();
        }
        
        this.log('👋 Application fermée', 'system');
    }
};

// ===== EVENT LISTENERS GLOBAUX ===== //
window.addEventListener('beforeunload', () => {
    App.destroy();
});

// Raccourcis clavier
document.addEventListener('keydown', (event) => {
    // Ctrl+S : Sauvegarder
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        App.saveConfig();
    }
    
    // Échap : Désélectionner
    if (event.key === 'Escape') {
        const currentTab = App.getCurrentTab();
        
        if (currentTab === 'pads' && typeof Pads !== 'undefined') {
            Pads.deselectAll();
        } else if (currentTab === 'buttons' && typeof Buttons !== 'undefined') {
            Buttons.deselectAll();
        }
    }
    
    // Touches 1-4 : Changer d'onglet
    if (event.key >= '1' && event.key <= '4' && !event.ctrlKey && !event.altKey) {
        const tabs = ['pads', 'buttons', 'sequencer', 'export'];
        const tabIndex = parseInt(event.key) - 1;
        if (tabs[tabIndex]) {
            App.switchTab(tabs[tabIndex]);
        }
    }
});

// Écouter les messages MIDI depuis le module MIDI
window.addEventListener('midi-message', (event) => {
    App.handleMIDIPreview(event.detail);
});