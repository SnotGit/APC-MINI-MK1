
const Pads = {
    selectedPad: null,
    configs: new Map(), // padNumber -> {color, active, name}
    
    init() {
        this.createGrid();
        this.initConfigs();
    },
    
    // Créer la grille 8x8 
    createGrid() {
        const grid = document.getElementById('padGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const padNumber = (7 - row) * 8 + col + 1; // 1-64
                const noteNumber = padNumber - 1; // 0-63
                
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.dataset.padNumber = padNumber;
                pad.dataset.note = noteNumber;
                pad.innerHTML = `<div class="pad-number">${padNumber}</div>`;
                
                pad.onclick = () => this.selectPad(padNumber);
                grid.appendChild(pad);
            }
        }
    },
    
    // Initialiser configurations par défaut
    initConfigs() {
        for (let i = 1; i <= 64; i++) {
            this.configs.set(i, {
                color: '',
                active: false,
                name: `Pad ${i}`
            });
        }
    },
    
    // Sélectionner un pad
    selectPad(padNumber) {
        // Désélectionner 
        if (this.selectedPad) {
            document.querySelector(`[data-pad-number="${this.selectedPad}"]`)?.classList.remove('selected');
        }
        
        // Sélectionner 
        this.selectedPad = padNumber;
        document.querySelector(`[data-pad-number="${padNumber}"]`)?.classList.add('selected');
        
        // Afficher config
        this.showConfig(padNumber);
        
        App.log(`Pad ${padNumber} sélectionné`, 'info');
    },
    
    // Afficher configuration pad
    showConfig(padNumber) {
        const config = this.configs.get(padNumber);
        const form = document.getElementById('individualConfig');
        
        form.innerHTML = `
            <div class="pad-config-header">
                <h3>Pad ${padNumber}</h3>
                <small>Note MIDI: ${padNumber - 1}</small>
            </div>
            <div class="form-row">
                <label>Couleur:</label>
                <select onchange="Pads.setColor(${padNumber}, this.value)">
                    <option value="" ${config.color === '' ? 'selected' : ''}>Aucune</option>
                    <option value="GREEN" ${config.color === 'GREEN' ? 'selected' : ''}>🟢 Vert</option>
                    <option value="RED" ${config.color === 'RED' ? 'selected' : ''}>🔴 Rouge</option>
                    <option value="YELLOW" ${config.color === 'YELLOW' ? 'selected' : ''}>🟡 Jaune</option>
                </select>
            </div>
        `;
    },
    
    // Définir couleur pad
    setColor(padNumber, color) {
        const config = this.configs.get(padNumber);
        config.color = color;
        config.active = !!color;
        
        this.updatePadDisplay(padNumber);
        
        // Envoyer à l'APC Mini
        if (MIDI.isConnected()) {
            MIDI.setPadColor(padNumber - 1, color || 'OFF');
        }
        
        App.saveConfig();
        App.log(`Pad ${padNumber} → ${color || 'OFF'}`, 'info');
    },
    
    // Mettre à jour affichage pad
    updatePadDisplay(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        const config = this.configs.get(padNumber);
        
        if (!pad) return;
        
        // Reset classes
        pad.classList.remove('assigned', 'assigned-green', 'assigned-red', 'assigned-yellow', 'active');
        
        // Appliquer couleur
        if (config.color) {
            pad.classList.add('assigned', `assigned-${config.color.toLowerCase()}`);
            if (config.active) {
                pad.classList.add('active');
            }
        }
    },
    
    // Assigner groupe de 16 pads
    assignGroup(groupIndex, color) {
        const startPad = groupIndex * 16 + 1;
        const endPad = startPad + 15;
        
        for (let pad = startPad; pad <= Math.min(endPad, 64); pad++) {
            this.setColor(pad, color);
        }
        
        App.log(`Groupe ${groupIndex + 1} → ${color}`, 'success');
    },
    
    // Gestion pression pad depuis MIDI
    handlePadPress(note) {
        const padNumber = note + 1;
        this.selectPad(padNumber);
    },
    
    // Obtenir configuration
    getConfig() {
        return Object.fromEntries(this.configs);
    },
    
    // Charger configuration
    loadConfig(configs) {
        for (const [pad, config] of Object.entries(configs)) {
            if (this.configs.has(parseInt(pad))) {
                this.configs.set(parseInt(pad), config);
                this.updatePadDisplay(parseInt(pad));
            }
        }
    }
};