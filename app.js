// app.js - Logique principale de l'application

const App = {
    // État de l'application
    state: {
        currentTab: 'pads',
        selectedPad: null,
        midiConnected: false,
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

    // Initialisation de l'application
    init() {
        this.log('Initialisation de l\'application...', 'info');
        
        // Initialiser les modules
        if (typeof Pads !== 'undefined') Pads.init();
        if (typeof Buttons !== 'undefined') Buttons.init();
        if (typeof MIDI !== 'undefined') MIDI.init();
        
        // Charger la configuration sauvegardée
        this.loadConfig();
        
        // Activer le premier onglet
        this.switchTab('pads');
        
        this.log('Application prête!', 'info');
    },

    // Système de logs
    log(message, type = 'info') {
        const terminal = document.getElementById('log-terminal');
        if (terminal) {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            entry.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${message}`;
            terminal.appendChild(entry);
            terminal.scrollTop = terminal.scrollHeight;
        }
    },

    // Gestion des onglets
    switchTab(tabId) {
        // Mise à jour de l'état
        this.state.currentTab = tabId;
        
        // Mise à jour des classes des boutons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Mise à jour de la visibilité des panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            const isActive = panel.id === `tab-${tabId}`;
            panel.classList.toggle('active', isActive);
            panel.style.display = isActive ? 'block' : 'none';
        });
        
        // Log
        this.log(`Affichage de l'onglet ${tabId}`);
    },

    // Connexion MIDI
    connectMIDI() {
        if (typeof MIDI !== 'undefined') {
            MIDI.connect();
        }
    },

    // Gestion de la configuration
    loadConfig() {
        const savedConfig = localStorage.getItem('apcMiniConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.state.config = { ...this.state.config, ...config };
                this.log('Configuration chargée', 'info');
            } catch (e) {
                this.log('Erreur lors du chargement de la configuration', 'error');
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

    // Export de la configuration
    exportConfig() {
        if (typeof Export !== 'undefined') {
            Export.generatePackage(this.state.config);
            this.log('Génération du package d\'exportation...', 'info');
        }
    }
};
