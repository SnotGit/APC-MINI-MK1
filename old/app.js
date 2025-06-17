
const App = {
    state: {
        midiConnected: false,
        currentMode: 'individual',
        config: {
            pads: {},
            buttons: {
                82: 'play_stop',
                83: 'session_record',
                84: 'overdub',
                85: 'undo',
                86: 'capture_midi',
                87: 'tap_tempo',
                88: 'device_control',
                89: 'stop_all_clips'
            }
        }
    },

    init() {
        this.loadConfig();
        this.initEvents();
        
        // Initialiser modules
        if (typeof Pads !== 'undefined') Pads.init();
        
        this.log('Interface APC Mini MK1 chargée', 'success');
    },

    initEvents() {
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && Pads.selectedPad) {
                Pads.selectPad(null);
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveConfig();
            }
        });

        // Sauvegarde avant fermeture
        window.addEventListener('beforeunload', () => {
            this.saveConfig();
            if (MIDI.isConnected()) MIDI.disconnect();
        });
    },

    // Connexion MIDI
    async connectMIDI() {
        this.log('Connexion APC Mini...', 'info');
        
        const success = await MIDI.connect();
        this.state.midiConnected = success;
        
        const btn = document.getElementById('connectBtn');
        if (btn) {
            if (success) {
                btn.textContent = 'CONNECTÉ';
                btn.className = 'btn success';
            } else {
                btn.textContent = 'ÉCHEC';
                btn.className = 'btn error';
                setTimeout(() => {
                    btn.textContent = 'CONNEXION';
                    btn.className = 'btn primary';
                }, 2000);
            }
        }
        
        return success;
    },

    // Gestion des modes
    setMode(mode) {
        this.state.currentMode = mode;
        
        // Mettre à jour UI
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.mode-tab')[mode === 'individual' ? 0 : 1]?.classList.add('active');
        
        const groupMode = document.getElementById('groupMode');
        const individualConfig = document.getElementById('individualConfig');
        
        if (mode === 'group') {
            groupMode.style.display = 'block';
            individualConfig.style.display = 'none';
        } else {
            groupMode.style.display = 'none';
            individualConfig.style.display = 'block';
        }
        
        this.log(`Mode ${mode} activé`, 'info');
    },

    // Assigner groupe de pads
    assignGroup(groupIndex, color) {
        if (typeof Pads !== 'undefined') {
            Pads.assignGroup(groupIndex, color);
        }
    },

    // Changer couleur groupe
    setGroupColor(groupIndex, color) {
        this.assignGroup(groupIndex, color);
    },

    // État connexion
    isConnected() {
        return this.state.midiConnected;
    },

    // Système de log
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

    // Sauvegarde config
    saveConfig() {
        try {
            this.state.config.pads = Pads ? Pads.getConfig() : {};
            localStorage.setItem('apcMiniConfig', JSON.stringify(this.state.config));
            this.log('Configuration sauvegardée', 'info');
        } catch (e) {
            this.log('Erreur sauvegarde', 'error');
        }
    },

    // Chargement config
    loadConfig() {
        try {
            const saved = localStorage.getItem('apcMiniConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.state.config = { ...this.state.config, ...config };
                
                // Charger dans les modules
                setTimeout(() => {
                    if (Pads && config.pads) {
                        Pads.loadConfig(config.pads);
                    }
                }, 100);
            }
        } catch (e) {
            this.log('Erreur chargement config', 'error');
        }
    },

    // Export config
    exportConfig() {
        if (typeof Export !== 'undefined') {
            Export.generatePackage(this.state.config);
            this.log('Génération package...', 'info');
        }
    }
};