const Sequencer = {
    
    // ===== ÉTAT =====
    isInitialized: false,
    activeGroup: 3, // Par défaut groupe 3
    currentMode: 'scales', // 'steps' | 'scales' - DÉMARRE EN MODE SCALES
    
    // ===== CONFIGURATION MUSICALE =====
    selectedScale: 'minor',
    octaveBase: 1,
    selectedSwing: 63,
    rootNote: 60, // C4 par défaut
    
    // ===== SÉQUENCEUR =====
    steps: Array(16).fill(false),
    isPlaying: false,
    currentStep: 0,
    playheadActive: false,
    
    // ===== MAPPING GROUPE 3 (16 STEPS) =====
    stepPads: [
        61, 62, 63, 64,  // Row 1: "major", "minor", "scale", "scale"
        53, 54, 55, 56,  // Row 2: "scale", "scale", "scale", "scale"  
        45, 46, 47, 48,  // Row 3: "swing", "swing", "swing", "swing"
        37, 38, 39, 40   // Row 4: "Play", "Mode", "Scales", "Clear"
    ],
    
    // ===== GAMMES MUSICALES =====
    scales: {
        'major': { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
        'minor': { name: 'Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
        'pentatonic': { name: 'Pentatonic', intervals: [0, 2, 4, 7, 9] },
        'blues': { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
        'dorian': { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
        'mixolydian': { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
        'phrygian': { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
        'chromatic': { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    },
    
    // ===== SWING PRESETS =====
    swingPresets: [20, 28, 50, 63],
    
    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.createSequencerGrid();
        this.createSequencerPanel();
        this.hideConfigModeSelector();
        this.setupEventListeners();
        this.isInitialized = true;
        
        App.log('✅ Séquenceur initialisé', 'info');
    },
    
    // ===== GRILLE SÉQUENCEUR (GAUCHE) =====
    createSequencerGrid() {
        const container = document.querySelector('.sequencer-content');
        if (!container) return;
        
        container.innerHTML = `
            <!-- CONTENEUR PRINCIPAL AVEC RECTANGLES -->
            <div class="sequencer-grid-container">
                
                <!-- RECTANGLE CONTENEUR GRILLE 4x4 -->
                <div class="sequencer-main-container">
                    <div class="sequencer-grid" id="sequencerGrid">
                        <!-- Généré par createGrid() -->
                    </div>
                </div>
                
                <!-- RECTANGLE CONTENEUR SWING SÉPARÉ -->
                <div class="swing-container">
                    <div class="swing-title">Réglage du Swing :</div>
                    <div class="swing-buttons" id="swingButtons">
                        ${this.swingPresets.map(value => `
                            <button class="swing-btn ${value === this.selectedSwing ? 'active' : ''}" 
                                    data-swing="${value}" onclick="Sequencer.setSwing(${value})">
                                ${value}%
                            </button>
                        `).join('')}
                    </div>
                </div>
                
            </div>
        `;
        
        this.createGrid();
    },
    
    // ===== PANEL SÉQUENCEUR (DROITE) =====
    createSequencerPanel() {
        const configPanel = document.getElementById('configContent');
        if (!configPanel) return;
        
        configPanel.innerHTML = `
            <!-- PANEL SEQUENCEUR -->
            <div class="sequencer-panel">
                
                <!-- GROUPE INFO -->
                <div class="sequencer-group-info">
                    <div class="group-title">Groupe : <span id="groupDisplay">${this.activeGroup}</span></div>
                    <div class="group-separator"></div>
                </div>
                
                <!-- SCALE SECTION -->
                <div class="sequencer-scale-section">
                    <div class="scale-row">
                        <span class="scale-label">Scale :</span>
                        <div class="scale-value" id="scaleDisplay">${this.scales[this.selectedScale].name}</div>
                    </div>
                </div>
                
                <!-- OCTAVE SECTION -->
                <div class="sequencer-octave-section">
                    <div class="octave-row">
                        <span class="octave-label">Octave :</span>
                        <div class="octave-controls">
                            <button class="octave-btn minus" onclick="Sequencer.changeOctave(-1)">−</button>
                            <div class="octave-value" id="octaveDisplay">${this.octaveBase}</div>
                            <button class="octave-btn plus" onclick="Sequencer.changeOctave(1)">+</button>
                        </div>
                    </div>
                </div>
                
                <!-- STATUS SECTION -->
                <div class="sequencer-status-section">
                    <div class="status-row">
                        <span>Mode :</span>
                        <span class="status-value" id="modeDisplay">${this.currentMode}</span>
                    </div>
                    <div class="status-row">
                        <span>Steps :</span>
                        <span class="status-value" id="stepsDisplay">${this.steps.filter(Boolean).length}/16</span>
                    </div>
                    <div class="status-row">
                        <span>Swing :</span>
                        <span class="status-value" id="swingDisplay">${this.selectedSwing}%</span>
                    </div>
                </div>
                
            </div>
        `;
    },
    
    // ===== GRILLE 4x4 DYNAMIQUE =====
    createGrid() {
        const grid = document.getElementById('sequencerGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.currentMode === 'steps') {
            this.createStepsGrid(grid);
        } else {
            this.createScalesGrid(grid);
        }
    },
    
    createStepsGrid(grid) {
        // Mode Steps : Grille 4x4 pour programmer les steps
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = `sequencer-pad step-pad ${this.steps[i] ? 'programmed' : ''}`;
            step.dataset.step = i;
            step.innerHTML = `<span class="pad-label">Step ${i + 1}</span>`;
            step.addEventListener('click', () => this.toggleStep(i));
            grid.appendChild(step);
        }
    },
    
    createScalesGrid(grid) {
        // Mode Scales : Interface selon design utilisateur
        const elements = [
            // Row 1: Gammes principales
            { type: 'scale', value: 'major', label: 'Major', color: null },
            { type: 'scale', value: 'minor', label: 'Minor', color: 'green' },
            { type: 'scale', value: 'pentatonic', label: 'Scale', color: null },
            { type: 'scale', value: 'blues', label: 'Scale', color: null },
            
            // Row 2: Gammes étendues
            { type: 'scale', value: 'dorian', label: 'Scale', color: null },
            { type: 'scale', value: 'mixolydian', label: 'Scale', color: null },
            { type: 'scale', value: 'phrygian', label: 'Scale', color: null },
            { type: 'scale', value: 'chromatic', label: 'Scale', color: null },
            
            // Row 3: Swing
            { type: 'swing', value: 20, label: 'Swing', color: null },
            { type: 'swing', value: 28, label: 'Swing', color: null },
            { type: 'swing', value: 50, label: 'Swing', color: null },
            { type: 'swing', value: 63, label: 'Swing', color: 'yellow' },
            
            // Row 4: Contrôles
            { type: 'control', value: 'play', label: 'Play', color: null },
            { type: 'control', value: 'mode', label: 'Mode', color: null },
            { type: 'control', value: 'scales', label: 'Scales', color: 'yellow' },
            { type: 'control', value: 'clear', label: 'Clear', color: 'red' }
        ];
        
        elements.forEach((element, index) => {
            const pad = document.createElement('div');
            pad.className = `sequencer-pad ${element.type}-pad`;
            pad.dataset.type = element.type;
            pad.dataset.value = element.value;
            
            // Appliquer couleurs selon design
            if (element.color) {
                pad.classList.add(`color-${element.color}`);
            }
            
            // États actifs
            if (element.type === 'scale' && element.value === this.selectedScale) {
                pad.classList.add('active');
            }
            if (element.type === 'swing' && element.value === this.selectedSwing) {
                pad.classList.add('active');
            }
            if (element.type === 'control' && element.value === this.currentMode) {
                pad.classList.add('active');
            }
            
            pad.innerHTML = `<span class="pad-label">${element.label}</span>`;
            pad.addEventListener('click', () => this.handleGridClick(element));
            grid.appendChild(pad);
        });
    },
    
    // ===== MASQUER CONFIG MODE SELECTOR =====
    hideConfigModeSelector() {
        const modeSelector = document.querySelector('.config-mode-selector');
        if (modeSelector) {
            modeSelector.style.display = 'none';
        }
    },
    
    showConfigModeSelector() {
        const modeSelector = document.querySelector('.config-mode-selector');
        if (modeSelector) {
            modeSelector.style.display = 'flex';
        }
    },
    
    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // MIDI preview
        window.addEventListener('midi-message', (event) => {
            if (App.getCurrentView() === 'sequencer') {
                this.handleMIDIPreview(event.detail);
            }
        });
    },
    
    handleGridClick(element) {
        switch (element.type) {
            case 'scale':
                this.setScale(element.value);
                break;
            case 'swing':
                this.setSwing(element.value);
                break;
            case 'control':
                this.handleControl(element.value);
                break;
        }
    },
    
    handleControl(control) {
        switch (control) {
            case 'play':
                this.togglePlay();
                break;
            case 'mode':
                this.switchMode();
                break;
            case 'scales':
                this.currentMode = 'scales';
                this.createGrid();
                this.updatePanel();
                break;
            case 'clear':
                this.clearSteps();
                break;
        }
    },
    
    // ===== SÉQUENCEUR =====
    toggleStep(stepIndex) {
        this.steps[stepIndex] = !this.steps[stepIndex];
        this.updateStepDisplay(stepIndex);
        this.syncToMIDI();
        this.updatePanel();
        
        App.log(`Step ${stepIndex + 1} ${this.steps[stepIndex] ? 'ON' : 'OFF'}`, 'info');
    },
    
    updateStepDisplay(stepIndex) {
        const stepPad = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepPad) {
            stepPad.classList.toggle('programmed', this.steps[stepIndex]);
        }
    },
    
    clearSteps() {
        this.steps.fill(false);
        this.updatePanel();
        this.createGrid(); // Refresh grille
        this.syncToMIDI();
        App.log('🗑️ Steps effacés', 'info');
    },
    
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.updatePanel();
        App.log(`▶️ Séquenceur ${this.isPlaying ? 'ON' : 'OFF'}`, 'success');
    },
    
    switchMode() {
        this.currentMode = this.currentMode === 'steps' ? 'scales' : 'steps';
        this.createGrid();
        this.updatePanel();
        App.log(`🔄 Mode: ${this.currentMode}`, 'info');
    },
    
    // ===== PARAMÈTRES MUSICAUX =====
    setScale(scaleKey) {
        if (this.scales[scaleKey]) {
            this.selectedScale = scaleKey;
            this.createGrid(); // Refresh pour état actif
            this.updatePanel();
            App.log(`🎵 Scale: ${this.scales[scaleKey].name}`, 'info');
        }
    },
    
    setSwing(value) {
        this.selectedSwing = value;
        
        // Mettre à jour boutons swing section
        document.querySelectorAll('.swing-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.swing) === value);
        });
        
        // Mettre à jour grille si en mode scales
        if (this.currentMode === 'scales') {
            this.createGrid();
        }
        
        this.updatePanel();
        App.log(`🎶 Swing: ${value}%`, 'info');
    },
    
    changeOctave(direction) {
        this.octaveBase = Math.max(-2, Math.min(8, this.octaveBase + direction));
        this.updatePanel();
        App.log(`🎹 Octave: ${this.octaveBase}`, 'info');
    },
    
    // ===== MISE À JOUR PANEL =====
    updatePanel() {
        // Panel feedback
        const groupDisplay = document.getElementById('groupDisplay');
        const scaleDisplay = document.getElementById('scaleDisplay');
        const octaveDisplay = document.getElementById('octaveDisplay');
        const modeDisplay = document.getElementById('modeDisplay');
        const stepsDisplay = document.getElementById('stepsDisplay');
        const swingDisplay = document.getElementById('swingDisplay');
        
        if (groupDisplay) groupDisplay.textContent = this.activeGroup;
        if (scaleDisplay) scaleDisplay.textContent = this.scales[this.selectedScale].name;
        if (octaveDisplay) octaveDisplay.textContent = this.octaveBase;
        if (modeDisplay) modeDisplay.textContent = this.currentMode;
        if (stepsDisplay) stepsDisplay.textContent = `${this.steps.filter(Boolean).length}/16`;
                                if (swingDisplay) swingDisplay.textContent = `${this.selectedSwing}%`;
    },
    
    // ===== MIDI =====
    handleMIDIPreview(message) {
        const { note, velocity } = message;
        
        if (velocity > 0) {
            // Mettre à jour root note si pad pressé
            this.rootNote = note;
            
            // Gestion steps si en mode steps
            if (this.currentMode === 'steps') {
                const stepIndex = this.getStepFromMIDI(note);
                if (stepIndex !== -1) {
                    this.toggleStep(stepIndex);
                }
            }
        }
    },
    
    getStepFromMIDI(midiNote) {
        const padNumber = midiNote + 1; // MIDI → Pad number
        return this.stepPads.indexOf(padNumber);
    },
    
    syncToMIDI() {
        if (!App.isConnected() || typeof MIDI === 'undefined') return;
        
        this.stepPads.forEach((padNumber, index) => {
            const midiNote = padNumber - 1;
            const color = this.steps[index] ? 'RED' : 'OFF';
            MIDI.setPadColor(midiNote, color);
        });
    },
    
    // ===== CLEANUP POUR RETOUR PADS =====
    cleanup() {
        // Remettre config mode selector
        this.showConfigModeSelector();
        
        // Sauvegarder config
        this.saveConfig();
    },
    
    // ===== CONFIGURATION =====
    saveConfig() {
        App.updateConfig('sequencer', {
            selectedScale: this.selectedScale,
            octaveBase: this.octaveBase,
            selectedSwing: this.selectedSwing,
            steps: [...this.steps],
            currentMode: this.currentMode,
            activeGroup: this.activeGroup
        });
    },
    
    loadConfig(config) {
        if (config.sequencer) {
            const seq = config.sequencer;
            this.selectedScale = seq.selectedScale || 'minor';
            this.octaveBase = seq.octaveBase || 1;
            this.selectedSwing = seq.selectedSwing || 63;
            this.steps = seq.steps || Array(16).fill(false);
            this.currentMode = seq.currentMode || 'scales'; // DÉFAUT SCALES
            this.activeGroup = seq.activeGroup || 3;
            
            if (this.isInitialized) {
                this.createSequencerPanel();
                this.updatePanel();
                this.createGrid();
            }
        }
    }
};

// ===== ÉVÉNEMENTS GLOBAUX =====
window.addEventListener('config-changed', (event) => {
    Sequencer.loadConfig(event.detail);
});