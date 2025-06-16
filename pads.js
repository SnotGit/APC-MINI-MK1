// pads.js - Gestion de la configuration des pads (VERSION CORRIGÉE)

const Pads = {
    selectedPad: null,
    padConfigs: {},
    
    // Initialisation
    init() {
        this.createPadGrid();
        this.initializeConfigs();
    },
    
    // Créer la grille de pads
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) {
            console.error('Pad grid element not found (ID: padGrid)');
            return;
        }
        grid.innerHTML = '';

        for (let i = 0; i < 64; i++) {
            const visualRow = 7 - Math.floor(i / 8); // lignes visuelles de bas (7) à haut (0)
            const col = i % 8;

            const padIndex = i; // padIndex logique
            const noteNumber = this.rowColToNote(visualRow, col); // notes MIDI : visuellement bas = row 7

            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.index = padIndex;
            pad.dataset.note = noteNumber;
            pad.innerHTML = `${padIndex + 1}`; // Affichage de 1 à 64

            pad.addEventListener('click', () => this.selectPad(padIndex));
            grid.appendChild(pad);
        }

        console.log('Grille de pads créée avec 1 en bas à gauche ✅');
    },

    // ✅ NOUVELLE FONCTION : Conversion row/col vers note MIDI
    rowColToNote(row, col) {
        // Mapping APC Mini : ligne du bas = notes basses
        return (7 - row) * 8 + col;
    },
    
    // ✅ NOUVELLE FONCTION : Conversion note MIDI vers pad index
    noteToPadIndex(note) {
        const row = 7 - Math.floor(note / 8);
        const col = note % 8;
        return row * 8 + col;
    },
    
    // Initialiser les configurations
    initializeConfigs() {
        for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const noteNumber = this.rowColToNote(row, col);
            
            this.padConfigs[i] = {
                note: noteNumber,
                name: `Pad ${i}`,
                color: '',
                active: false
            };
        }
        
        console.log('Configurations des pads initialisées');
    },
    
    // Sélectionner un pad
    selectPad(padIndex) {
        // Désélectionner l'ancien pad
        if (this.selectedPad !== null) {
            const oldPad = document.querySelector(`[data-index="${this.selectedPad}"]`);
            if (oldPad) oldPad.classList.remove('selected');
        }
        
        // Sélectionner le nouveau pad
        this.selectedPad = padIndex;
        const pad = document.querySelector(`[data-index="${padIndex}"]`);
        if (pad) pad.classList.add('selected');
        
        // Afficher la configuration
        this.showPadConfig(padIndex);
        
        // ✅ CORRECTION : Vérifier que App existe et a la fonction log
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Pad ${padIndex} sélectionné (Note ${this.padConfigs[padIndex].note})`, 'info');
        }
    },
    
    // Afficher la configuration d'un pad
    showPadConfig(padIndex) {
        const config = this.padConfigs[padIndex];
        const form = document.getElementById('individualConfig');
        if (!form) return;
        
        form.innerHTML = `
            <div class="form-row">
                <label>Nom:</label>
                <input type="text" 
                       id="pad-name" 
                       value="${config.name}" 
                       placeholder="Nom du pad">
            </div>
            
            <div class="form-row">
                <label>Note MIDI:</label>
                <input type="number" 
                       value="${config.note}" 
                       disabled>
            </div>
            
            <div class="form-row">
                <label>Couleur:</label>
                <select id="pad-color" onchange="Pads.updatePadColor(${padIndex}, this.value)">
                    <option value="" ${config.color === '' ? 'selected' : ''}>
                        Aucune (mapping dans Ableton)
                    </option>
                    <option value="GREEN" ${config.color === 'GREEN' ? 'selected' : ''}>
                        Vert
                    </option>
                    <option value="RED" ${config.color === 'RED' ? 'selected' : ''}>
                        Rouge
                    </option>
                    <option value="YELLOW" ${config.color === 'YELLOW' ? 'selected' : ''}>
                        Jaune
                    </option>
                </select>
            </div>
            
            <div class="form-row">
                <label>État:</label>
                <button onclick="Pads.togglePad(${padIndex})" class="btn">
                    ${config.active ? 'Désactiver' : 'Activer'}
                </button>
            </div>
        `;
        
        // Événement de changement de nom
        const nameInput = document.getElementById('pad-name');
        if (nameInput) {
            nameInput.addEventListener('change', (e) => {
                this.padConfigs[padIndex].name = e.target.value;
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Nom du pad ${padIndex} changé pour "${e.target.value}"`, 'info');
                }
                this.saveConfig();
            });
        }
    },
    
    // Mettre à jour la couleur d'un pad
    updatePadColor(padIndex, color) {
        this.padConfigs[padIndex].color = color;
        
        // ✅ CORRECTION : Vérifier que App existe et est connecté
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            // ✅ CORRECTION : Utiliser la bonne fonction
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(this.padConfigs[padIndex].note, color);
            }
        }
        
        // Mettre à jour l'affichage
        this.updatePadDisplay(padIndex);
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Couleur du pad ${padIndex} changée pour ${color || 'Aucune'}`, 'info');
        }
    },
    
    // Basculer l'état d'un pad
    togglePad(padIndex) {
        const config = this.padConfigs[padIndex];
        config.active = !config.active;
        
        // ✅ CORRECTION : Vérifier que App existe et est connecté
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(config.note, config.active ? config.color : 'OFF');
            }
        }
        
        // Mettre à jour l'affichage
        this.updatePadDisplay(padIndex);
        this.showPadConfig(padIndex); // Rafraîchir le formulaire
        this.saveConfig();
    },
    
    // Mettre à jour l'affichage d'un pad
    updatePadDisplay(padIndex) {
        const pad = document.querySelector(`[data-index="${padIndex}"]`);
        const config = this.padConfigs[padIndex];
        
        if (pad) {
            // Retirer toutes les classes de couleur
            pad.classList.remove('active', 'assigned-green', 'assigned-red', 'assigned-yellow');
            
            if (config.color) {
                pad.classList.add('assigned-' + config.color.toLowerCase());
            }
            
            if (config.active) {
                pad.classList.add('active');
            }
            
            // Mettre à jour le tooltip
            pad.title = `${config.name} (Note ${config.note}) - ${config.color || 'Non assigné'}`;
        }
    },
    
    // Assigner un groupe de pads
    assignGroup(groupIndex, color) {
        const rowSize = 8;
        const halfRow = rowSize / 2;
        
        let startRow, endRow, startCol, endCol;
        
        switch(groupIndex) {
            case 0: // Haut-gauche (lignes 0-3, colonnes 0-3)
                startRow = 0; endRow = 3;
                startCol = 0; endCol = 3;
                break;
            case 1: // Haut-droite (lignes 0-3, colonnes 4-7)
                startRow = 0; endRow = 3;
                startCol = 4; endCol = 7;
                break;
            case 2: // Bas-gauche (lignes 4-7, colonnes 0-3)
                startRow = 4; endRow = 7;
                startCol = 0; endCol = 3;
                break;
            case 3: // Bas-droite (lignes 4-7, colonnes 4-7)
                startRow = 4; endRow = 7;
                startCol = 4; endCol = 7;
                break;
        }
        
        // Appliquer la couleur au groupe
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const padIndex = row * 8 + col;
                this.padConfigs[padIndex].color = color;
                this.updatePadDisplay(padIndex);
                
                // Envoyer via MIDI si connecté
                if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
                    if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                        MIDI.setPadColor(this.padConfigs[padIndex].note, color);
                    }
                }
            }
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Groupe ${groupIndex + 1} configuré avec la couleur ${color}`, 'info');
        }
    },
    
    // Gérer la pression d'un pad via MIDI
    handlePadPress(note) {
        const padIndex = this.noteToPadIndex(note);
        if (padIndex >= 0 && padIndex < 64) {
            this.togglePad(padIndex);
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Pad ${padIndex} (Note ${note}) pressé`, 'info');
            }
        }
    },
    
    // Sauvegarder la configuration
    saveConfig() {
        const event = new CustomEvent('config-changed', {
            detail: { pads: this.padConfigs }
        });
        window.dispatchEvent(event);
    },
    
    // Charger une configuration
    loadConfig(config) {
        if (config && config.pads) {
            this.padConfigs = { ...this.padConfigs, ...config.pads };
            
            // Mettre à jour l'affichage de tous les pads
            for (let i = 0; i < 64; i++) {
                if (this.padConfigs[i]) {
                    this.updatePadDisplay(i);
                }
            }
            
            if (typeof App !== 'undefined' && App.log) {
                App.log('Configuration des pads chargée', 'info');
            }
        }
    },
    
    // Réinitialiser tous les pads
    clearAllPads() {
        for (let i = 0; i < 64; i++) {
            this.padConfigs[i].color = '';
            this.padConfigs[i].active = false;
            this.updatePadDisplay(i);
        }
        
        // Éteindre tous les pads sur l'APC Mini
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.clearAll) {
                MIDI.clearAll();
            }
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('Tous les pads réinitialisés', 'info');
        }
    },
    
    // Test pattern sur tous les pads
    testPattern() {
        const colors = ['GREEN', 'RED', 'YELLOW'];
        let colorIndex = 0;
        
        for (let i = 0; i < 64; i++) {
            setTimeout(() => {
                const color = colors[colorIndex % 3];
                this.padConfigs[i].color = color;
                this.padConfigs[i].active = true;
                this.updatePadDisplay(i);
                
                if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
                    if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                        MIDI.setPadColor(this.padConfigs[i].note, color);
                    }
                }
                
                colorIndex++;
            }, i * 50);
        }
        
        // Arrêter le test après 5 secondes
        setTimeout(() => {
            this.clearAllPads();
        }, 5000);
    }
};