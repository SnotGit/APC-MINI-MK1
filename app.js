// app.js - Contrôleur principal simple

const App = {
    state: {
        currentTab: 'pads',
        selectedPad: null,
        midiConnected: false,
        currentMode: 'individual',
        currentButtonView: 'normal',
        config: {
            pads: {},
            buttons: {
                82: 'play_stop',
                83: 'session_record', 
                84: 'overdub',
                85: 'undo',
                86: 'capture_midi',
                87: 'stop_all_clips',
                88: 'tap_tempo'
            }
        }
    },

    init() {
        this.loadConfig();
        this.switchTab('pads');
        this.initEvents();
    },

    initEvents() {
        window.addEventListener('config-changed', (event) => {
            if (event.detail.buttons) {
                this.state.config.buttons = { ...this.state.config.buttons, ...event.detail.buttons };
                this.saveConfig();
            }
            if (event.detail.pads) {
                this.state.config.pads = { ...this.state.config.pads, ...event.detail.pads };
                this.saveConfig();
            }
        });
    },

    log(message, type = 'info') {
        const terminal = document.getElementById('logTerminal');
        if (terminal) {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            entry.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${message}`;
            terminal.appendChild(entry);
            terminal.scrollTop = terminal.scrollHeight;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    switchTab(tabId) {
        this.state.currentTab = tabId;
        
        // Mettre à jour les header tabs
        document.querySelectorAll('.header-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mettre à jour les panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add('active');
                panel.style.display = 'flex';
            } else {
                panel.classList.remove('active');
                panel.style.display = 'none';
            }
        });
        
        // Initialiser les modules si nécessaire
        if (tabId === 'pads' && typeof Pads !== 'undefined') {
            Pads.init();
        } else if (tabId === 'buttons' && typeof Buttons !== 'undefined') {
            Buttons.init();
        }
    },

    setMode(mode) {
        this.state.currentMode = mode;
        
        // Mettre à jour les mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = mode === 'individual' ? 0 : 1;
        const modeTabs = document.querySelectorAll('.mode-tab');
        if (modeTabs[activeTab]) {
            modeTabs[activeTab].classList.add('active');
        }
        
        // Afficher/cacher les sections
        const groupMode = document.getElementById('groupMode');
        const individualConfig = document.getElementById('individualConfig');
        
        if (mode === 'group') {
            if (groupMode) groupMode.style.display = 'block';
            if (individualConfig) individualConfig.style.display = 'none';
        } else {
            if (groupMode) groupMode.style.display = 'none';
            if (individualConfig) individualConfig.style.display = 'block';
        }
        
        this.log(`Mode ${mode} activé`, 'info');
    },

    assignGroup(groupIndex, color) {
        this.log(`Attribution du groupe ${groupIndex + 1} en ${color}`, 'info');
        
        if (typeof Pads !== 'undefined') {
            Pads.assignGroup(groupIndex, color);
        } else {
            this.log('Module Pads non disponible', 'error');
        }
    },

    setGroupColor(groupIndex, color) {
        this.log(`Changement couleur groupe ${groupIndex + 1} → ${color}`, 'info');
        this.assignGroup(groupIndex, color);
    },

    setButtonView(view) {
        this.state.currentButtonView = view;
        
        // Mettre à jour les toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            if (btn.textContent.toLowerCase() === view.toLowerCase()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.log(`Vue boutons: ${view}`, 'info');
        
        if (typeof Buttons !== 'undefined') {
            Buttons.setView(view);
        }
    },

    isConnected() {
        return this.state.midiConnected;
    },

    async connectMIDI() {
        this.log('Tentative de connexion MIDI...', 'info');
        
        if (typeof MIDI !== 'undefined') {
            const success = await MIDI.connect();
            this.state.midiConnected = success;
            
            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                if (success) {
                    connectBtn.textContent = 'CONNECTÉ';
                    connectBtn.style.background = '#2ecc71';
                    connectBtn.style.borderColor = '#2ecc71';
                    this.log('APC Mini connecté avec succès', 'info');
                } else {
                    connectBtn.textContent = 'ÉCHEC';
                    connectBtn.style.background = '#e74c3c';
                    connectBtn.style.borderColor = '#e74c3c';
                    this.log('Connexion APC Mini échouée', 'error');
                    setTimeout(() => {
                        connectBtn.textContent = 'CONNEXION';
                        connectBtn.style.background = '';
                        connectBtn.style.borderColor = '';
                    }, 2000);
                }
            }
            
            return success;
        } else {
            this.log('Module MIDI non disponible', 'error');
            return false;
        }
    },

    loadConfig() {
        const savedConfig = localStorage.getItem('apcMiniConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.state.config = { ...this.state.config, ...config };
                
                if (typeof Pads !== 'undefined' && config.pads) {
                    Pads.loadConfig(config);
                }
                if (typeof Buttons !== 'undefined' && config.buttons) {
                    Buttons.loadConfig(config.buttons);
                }
            } catch (e) {
                console.error('Erreur lors du chargement de la configuration');
            }
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apcMiniConfig', JSON.stringify(this.state.config));
            this.log('Configuration sauvegardée', 'info');
        } catch (e) {
            this.log('Erreur lors de la sauvegarde de la configuration', 'error');
        }
    },

    exportConfig() {
        if (typeof Export !== 'undefined') {
            Export.generatePackage(this.state.config);
            this.log('Génération du package d\'exportation...', 'info');
        } else {
            this.log('Module Export non disponible', 'error');
        }
    },

    testMIDI() {
        if (this.isConnected() && typeof MIDI !== 'undefined') {
            MIDI.testPattern();
            this.log('Test MIDI lancé', 'info');
        } else {
            this.log('Connectez d\'abord l\'APC Mini', 'warning');
        }
    }
};