const Pads = {
    selectedPad: null,
    padConfigs: {},
    
    init() {
        this.createPadGrid();
        this.initializeConfigs();
    },
    
    createPadGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) {
            console.error('Pad grid element not found (ID: padGrid)');
            return;
        }
        grid.innerHTML = '';
        
        // Créer 64 pads (8x8) - Numérotés de 1 à 64
        for (let visualRow = 0; visualRow < 8; visualRow++) {
            for (let col = 0; col < 8; col++) {
                // Pad 1 en bas à gauche, 64 en haut à droite
                const padNumber = (7 - visualRow) * 8 + col + 1; // 1 à 64
                const noteNumber = this.padNumberToMidiNote(padNumber);
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.dataset.note = noteNumber;
                pad.innerHTML = padNumber;
                
                pad.addEventListener('click', () => this.selectPad(padNumber));
                
                grid.appendChild(pad);
            }
        }
    },
    
    // Conversion pad number (1-64) vers note MIDI (0-63)
    padNumberToMidiNote(padNumber) {
        // padNumber: 1-64, on convertit en 0-63
        const padIndex = padNumber - 1;
        const visualRow = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        
        // Pour APC Mini MK1: note MIDI = (7 - visualRow) * 8 + col
        const midiNote = (7 - visualRow) * 8 + col;
        return midiNote;
    },
    
    // Conversion note MIDI (0-63) vers pad number (1-64)
    midiNoteToPadNumber(midiNote) {
        const midiRow = Math.floor(midiNote / 8);
        const col = midiNote % 8;
        const visualRow = 7 - midiRow;
        const padNumber = visualRow * 8 + col + 1;
        return padNumber;
    },
    
    initializeConfigs() {
        for (let padNumber = 1; padNumber <= 64; padNumber++) {
            const noteNumber = this.padNumberToMidiNote(padNumber);
            
            this.padConfigs[padNumber] = {
                note: noteNumber,
                name: `Pad ${padNumber}`,
                color: '',
                active: false
            };
        }
    },
    
    selectPad(padNumber) {
        // Désélectionner l'ancien pad
        if (this.selectedPad !== null) {
            const oldPad = document.querySelector(`[data-pad-number="${this.selectedPad}"]`);
            if (oldPad) oldPad.classList.remove('selected');
        }
        
        // Sélectionner le nouveau pad
        this.selectedPad = padNumber;
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (pad) pad.classList.add('selected');
        
        // Afficher la configuration
        this.showPadConfig(padNumber);
        
        if (typeof App !== 'undefined' && App.log) {
            const noteNumber = this.padConfigs[padNumber].note;
            App.log(`Pad ${padNumber} sélectionné (Note MIDI ${noteNumber})`, 'info');
        }
    },
    
    showPadConfig(padNumber) {
        const config = this.padConfigs[padNumber];
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
                <label>Pad:</label>
                <input type="number" 
                       value="${padNumber}" 
                       disabled>
            </div>
            
            <div class="form-row">
                <label>Note MIDI:</label>
                <input type="number" 
                       value="${config.note}" 
                       disabled>
            </div>
            
            <div class="form-row">
                <label>Couleur:</label>
                <select id="pad-color" onchange="Pads.updatePadColor(${padNumber}, this.value)">
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
                <button onclick="Pads.togglePad(${padNumber})" class="btn">
                    ${config.active ? 'Désactiver' : 'Activer'}
                </button>
            </div>
        `;
        
        // Événement de changement de nom
        const nameInput = document.getElementById('pad-name');
        if (nameInput) {
            nameInput.addEventListener('change', (e) => {
                this.padConfigs[padNumber].name = e.target.value;
                if (typeof App !== 'undefined' && App.log) {
                    App.log(`Nom du pad ${padNumber} changé pour "${e.target.value}"`, 'info');
                }
                this.saveConfig();
            });
        }
    },
    
    updatePadColor(padNumber, color) {
        this.padConfigs[padNumber].color = color;
        
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(this.padConfigs[padNumber].note, color);
            }
        }
        
        this.updatePadDisplay(padNumber);
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Couleur du pad ${padNumber} changée pour ${color || 'Aucune'}`, 'info');
        }
    },
    
    togglePad(padNumber) {
        const config = this.padConfigs[padNumber];
        config.active = !config.active;
        
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                MIDI.setPadColor(config.note, config.active ? config.color : 'OFF');
            }
        }
        
        this.updatePadDisplay(padNumber);
        this.showPadConfig(padNumber); // Rafraîchir le formulaire
        this.saveConfig();
    },
    
    updatePadDisplay(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        const config = this.padConfigs[padNumber];
        
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
    
    assignGroup(groupIndex, color) {
        let startPad, endPad;
        
        switch(groupIndex) {
            case 0: // Haut-gauche (pads 33-40, 41-48, 49-56, 57-64)
                startPad = 33; endPad = 64;
                break;
            case 1: // Haut-droite (pads 29-32, 37-40, 45-48, 53-56, 61-64)
                startPad = 29; endPad = 64;
                break;
            case 2: // Bas-gauche (pads 1-8, 9-16, 17-24, 25-32)
                startPad = 1; endPad = 32;
                break;
            case 3: // Bas-droite (pads 5-8, 13-16, 21-24, 29-32)
                startPad = 1; endPad = 32;
                break;
        }
        
        // Appliquer la couleur au groupe (simplifié pour test)
        const startRow = Math.floor((startPad - 1) / 8);
        const endRow = Math.floor((endPad - 1) / 8);
        const startCol = groupIndex % 2 === 0 ? 0 : 4;
        const endCol = groupIndex % 2 === 0 ? 3 : 7;
        
        for (let row = startRow; row <= endRow && row < 4; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const padNumber = row * 8 + col + 1;
                if (padNumber >= 1 && padNumber <= 64) {
                    this.padConfigs[padNumber].color = color;
                    this.updatePadDisplay(padNumber);
                    
                    if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
                        if (typeof MIDI !== 'undefined' && MIDI.setPadColor) {
                            MIDI.setPadColor(this.padConfigs[padNumber].note, color);
                        }
                    }
                }
            }
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Groupe ${groupIndex + 1} configuré avec la couleur ${color}`, 'info');
        }
    },
    
    handlePadPress(midiNote) {
        const padNumber = this.midiNoteToPadNumber(midiNote);
        if (padNumber >= 1 && padNumber <= 64) {
            this.togglePad(padNumber);
            if (typeof App !== 'undefined' && App.log) {
                App.log(`Pad ${padNumber} (Note MIDI ${midiNote}) pressé`, 'info');
            }
        }
    },
    
    saveConfig() {
        const event = new CustomEvent('config-changed', {
            detail: { pads: this.padConfigs }
        });
        window.dispatchEvent(event);
    },
    
    loadConfig(config) {
        if (config && config.pads) {
            this.padConfigs = { ...this.padConfigs, ...config.pads };
            
            for (let padNumber = 1; padNumber <= 64; padNumber++) {
                if (this.padConfigs[padNumber]) {
                    this.updatePadDisplay(padNumber);
                }
            }
        }
    },
    
    clearAllPads() {
        for (let padNumber = 1; padNumber <= 64; padNumber++) {
            this.padConfigs[padNumber].color = '';
            this.padConfigs[padNumber].active = false;
            this.updatePadDisplay(padNumber);
        }
        
        if (typeof App !== 'undefined' && App.isConnected && App.isConnected()) {
            if (typeof MIDI !== 'undefined' && MIDI.clearAll) {
                MIDI.clearAll();
            }
        }
        
        this.saveConfig();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log('Tous les pads réinitialisés', 'info');
        }
    }
};