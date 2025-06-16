// pads.js - Gestion de la configuration des pads

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
        const grid = document.getElementById('pad-grid');
        if (!grid) {
            console.error('Grid element not found');
            return;
        }
        grid.innerHTML = '';
        
        // Créer 64 pads (8x8)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const padIndex = row * 8 + col;
                const noteNumber = MIDI.rowColToNote(row, col);
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.index = padIndex;
                pad.dataset.note = noteNumber;
                pad.innerHTML = `${noteNumber}<span class="pad-number">#${padIndex}</span>`;
                
                // Événement de clic
                pad.addEventListener('click', () => this.selectPad(padIndex));
                
                grid.appendChild(pad);
            }
        }
    },
    
    // Initialiser les configurations
    initializeConfigs() {
        for (let i = 0; i < 64; i++) {
            const noteNumber = MIDI.rowColToNote(Math.floor(i / 8), i % 8);
            
            this.padConfigs[i] = {
                note: noteNumber,
                name: `Pad ${i}`,
                color: '',
                active: false
            };
        }
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
        
        App.log(`Pad ${padIndex} sélectionné (Note ${this.padConfigs[padIndex].note})`, 'info');
    },
    
    // Afficher la configuration d'un pad
    showPadConfig(padIndex) {
        const config = this.padConfigs[padIndex];
        const form = document.getElementById('individualConfig');
        if (!form) return;
        
        form.innerHTML = `
            <div class="config-row">
                <label>Nom:</label>
                <input type="text" 
                       id="pad-name" 
                       value="${config.name}" 
                       placeholder="Nom du pad">
            </div>
            
            <div class="config-row">
                <label>Note MIDI:</label>
                <input type="number" 
                       value="${config.note}" 
                       disabled>
            </div>
            
            <div class="config-row">
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
        `;
        
        // Événement de changement de nom
        document.getElementById('pad-name').addEventListener('change', (e) => {
            this.padConfigs[padIndex].name = e.target.value;
            App.log(`Nom du pad ${padIndex} changé pour "${e.target.value}"`, 'info');
        });
    },
    
    // Mettre à jour la couleur d'un pad
    updatePadColor(padIndex, color) {
        this.padConfigs[padIndex].color = color;
        
        // Mettre à jour la couleur via MIDI si connecté
        if (App.isConnected()) {
            MIDI.sendNoteColor(this.padConfigs[padIndex].note, color);
        }
        
        App.log(`Couleur du pad ${padIndex} changée pour ${color || 'Aucune'}`, 'info');
    },
    
    // Basculer l'état d'un pad
    togglePad(padIndex) {
        const config = this.padConfigs[padIndex];
        config.active = !config.active;
        
        // Envoyer la nouvelle couleur via MIDI
        if (App.isConnected()) {
            MIDI.sendNoteColor(config.note, config.active ? config.color : '');
        }
        
        // Mettre à jour l'affichage
        this.updatePadDisplay(padIndex);
    },
    
    // Mettre à jour l'affichage d'un pad
    updatePadDisplay(padIndex) {
        const pad = document.querySelector(`[data-index="${padIndex}"]`);
        const config = this.padConfigs[padIndex];
        
        if (pad) {
            if (config.active) {
                pad.classList.add('active');
                if (config.color) pad.classList.add(config.color.toLowerCase());
            } else {
                pad.classList.remove('active', 'green', 'red', 'yellow');
            }
        }
    },
    
    // Assigner un groupe de pads
    assignGroup(groupIndex, color) {
        const rowSize = 8;
        const halfRow = rowSize / 2;
        const halfGrid = 32;
        
        let startPad, endPad;
        
        switch(groupIndex) {
            case 0: // Haut-gauche
                startPad = 0;
                endPad = halfRow - 1;
                break;
            case 1: // Haut-droite
                startPad = halfRow;
                endPad = rowSize - 1;
                break;
            case 2: // Bas-gauche
                startPad = halfGrid;
                endPad = halfGrid + halfRow - 1;
                break;
            case 3: // Bas-droite
                startPad = halfGrid + halfRow;
                endPad = halfGrid + rowSize - 1;
                break;
        }
        
        for (let i = startPad; i <= endPad; i++) {
            this.padConfigs[i].color = color;
            if (App.isConnected()) {
                MIDI.sendNoteColor(this.padConfigs[i].note, color);
            }
        }
        
        App.log(`Groupe ${groupIndex + 1} configuré avec la couleur ${color}`, 'info');
    },
    
    // Gérer la pression d'un pad via MIDI
    handlePadPress(note) {
        const padIndex = MIDI.noteToPadIndex(note);
        if (padIndex >= 0 && padIndex < 64) {
            this.togglePad(padIndex);
            App.log(`Pad ${padIndex} (Note ${note}) pressé`, 'info');
        }
    },
    
    // Sauvegarder la configuration
    saveConfig() {
        return {
            pads: this.padConfigs
        };
    },
    
    // Charger une configuration
    loadConfig(config) {
        if (config && config.pads) {
            this.padConfigs = config.pads;
            // Mettre à jour l'affichage de tous les pads
            for (let i = 0; i < 64; i++) {
                this.updatePadDisplay(i);
            }
            App.log('Configuration des pads chargée', 'success');
        }
    }
};
