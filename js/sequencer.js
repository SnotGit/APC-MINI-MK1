const Sequencer = {
    
    // ===== ÉTAT =====
    isInitialized: false,
    activeGroup: null, // 2 ou 3
    currentMode: 'steps', // 'steps' | 'scales'
    
    // ===== CONFIGURATION MUSICALE =====
    selectedScale: 'major',
    octaveBase: 0,
    selectedSwing: 50,
    rootNote: 60, // C4 par défaut
    
    // ===== SÉQUENCEUR =====
    steps: Array(16).fill(false),
    isPlaying: false,
    currentStep: 0,
    
    // ===== MAPPING GROUPE 3 (16 STEPS) =====
    stepPads: [
        61, 62, 63, 64,  // Row 1
        53, 54, 55, 56,  // Row 2  
        45, 46, 47, 48,  // Row 3
        37, 38, 39, 40   // Row 4
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
    swingPresets: [20, 25, 50, 63],
    
    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.createSequencerInterface();
        this.createControlPanel();
        this.setupEventListeners();
        this.isInitialized = true;
        
        App.log('✅ Séquenceur initialisé', 'info');
    },
    
    // ===== INTERFACE GAUCHE (GRILLE + SWING) =====
    createSequencerInterface() {
        const container = document.querySelector('.sequencer-content');
        if (!container) return;
        
        container.innerHTML = `
            <!-- GRILLE 4x4 -->
            <div class="sequencer-grid" id="sequencerGrid">
                <!-- Généré par createGrid() -->
            </div>
            
            <!-- SECTION SWING -->
            <div class="swing-section">
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
        `;
        
        this.createGrid();
    },
    
    // ===== INTERFACE DROITE (PANEL FEEDBACK) =====
    createControlPanel() {
        const configPanel = document.getElementById('configContent');
        if (!configPanel) return;
        
        configPanel.innerHTML = `
            <!-- PANEL INFO -->
            <div class="sequencer-feedback-panel">
                <div class="feedback-title">Groupe : <span id="groupDisplay">${this.activeGroup || 'Aucun'}</span></div>
                <div class="feedback-separator"></div>
                <div class="feedback-row">
                    <span>Scale :</span>
                    <div class="feedback-value" id="scaleDisplay">${this.scales[this.selectedScale].name}</div>
                </div>
                <div class="feedback-row">
                    <span>Octave :</span>
                    <div class="octave-controls">
                        <button class="octave-btn" onclick="Sequencer.changeOctave(-1)">−</button>
                        <div class="octave-value" id="octaveDisplay">${this.octaveBase}</div>
                        <button class="octave-btn" onclick="Sequencer.changeOctave(1)">+</button>
                    </div>
                </div>
            </div>
            
            <!-- PANEL STATUS -->
            <div class="sequencer-status-panel">
                <div class="status-title">État Séquenceur</div>
                <div class="status-info">
                    <div>Mode : <span id="modeDisplay">${this.currentMode}</span></div>
                    <div>Steps : <span id="stepsDisplay">${this.steps.filter(Boolean).length}/16</span></div>
                    <div>Swing : <span id="swingDisplay">${this.selectedSwing}%</span></div>
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
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = `sequencer-pad step-pad ${this.steps[i] ? 'programmed' : ''}`;
            step.dataset.step = i;
            step.innerHTML = `<span class="pad-label">${this.stepPads[i]}</span>`;
            step.addEventListener('click', () => this.toggleStep(i));
            grid.appendChild(step);
        }
    },
    
    createScalesGrid(grid) {
        const elements = [
            // Row 1-2: Gammes (8)
            { type: 'scale', value: 'major', label: 'Major' },
            { type: 'scale', value: 'minor', label: 'Minor' },
            { type: 'scale', value: 'pentatonic', label: 'Penta' },
            { type: 'scale', value: 'blues', label: 'Blues' },
            { type: 'scale', value: 'dorian', label: 'Dorian' },
            { type: 'scale', value: 'mixolydian', label: 'Mixo' },
            { type: 'scale', value: 'phrygian', label: 'Phryg' },
            { type: 'scale', value: 'chromatic', label: 'Chroma' },
            
            // Row 3: Swing (4)
            { type: 'swing', value: 20, label: 'Swing' },
            { type: 'swing', value: 25, label: 'Swing' },
            { type: 'swing', value: 50, label: 'Swing' },
            { type: 'swing', value: 63, label: 'Swing' },
            
            // Row 4: Contrôles (4)
            { type: 'control', value: 'play', label: 'Play' },
            { type: 'control', value: 'mode', label: 'Mode' },
            { type: 'control', value: 'scales', label: 'Scales' },
            { type: 'control', value: 'clear', label: 'Clear' }
        ];
        
        elements.forEach((element, index) => {
            const pad = document.createElement('div');
            pad.className = `sequencer-pad ${element.type}-pad`;
            pad.dataset.type = element.type;
            pad.dataset.value = element.value;
            pad.innerHTML = `<span class="pad-label">${element.label}</span>`;
            
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
            
            pad.addEventListener('click', () => this.handleGridClick(element));
            grid.appendChild(pad);
        });
    },
    
    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Navigation mode depuis pads
        window.addEventListener('pads-sequencer-activated', (event) => {
            this.activeGroup = event.detail.group;
            this.updateInterface();
        });
        
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
                this.updateInterface();
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
        this.updateInterface();
        
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
        this.updateInterface();
        this.createGrid(); // Refresh grille
        this.syncToMIDI();
        App.log('🗑️ Steps effacés', 'info');
    },
    
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.updateInterface();
        App.log(`▶️ Séquenceur ${this.isPlaying ? 'ON' : 'OFF'}`, 'success');
    },
    
    switchMode() {
        this.currentMode = this.currentMode === 'steps' ? 'scales' : 'steps';
        this.createGrid();
        this.updateInterface();
        App.log(`🔄 Mode: ${this.currentMode}`, 'info');
    },
    
    // ===== PARAMÈTRES MUSICAUX =====
    setScale(scaleKey) {
        if (this.scales[scaleKey]) {
            this.selectedScale = scaleKey;
            this.createGrid(); // Refresh pour état actif
            this.updateInterface();
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
        
        this.updateInterface();
        App.log(`🎶 Swing: ${value}%`, 'info');
    },
    
    changeOctave(direction) {
        this.octaveBase = Math.max(-2, Math.min(8, this.octaveBase + direction));
        this.updateInterface();
        App.log(`🎹 Octave: ${this.octaveBase}`, 'info');
    },
    
    // ===== MISE À JOUR INTERFACE =====
    updateInterface() {
        // Panel feedback
        const groupDisplay = document.getElementById('groupDisplay');
        const scaleDisplay = document.getElementById('scaleDisplay');
        const octaveDisplay = document.getElementById('octaveDisplay');
        const modeDisplay = document.getElementById('modeDisplay');
        const stepsDisplay = document.getElementById('stepsDisplay');
        const swingDisplay = document.getElementById('swingDisplay');
        
        if (groupDisplay) groupDisplay.textContent = this.activeGroup || 'Aucun';
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
    
    // ===== ACTIVATION DEPUIS PADS =====
    activateFromPads(groupId) {
        this.activeGroup = groupId;
        this.createControlPanel(); // Refresh panel droite
        this.updateInterface();
        
        App.log(`🎹 Séquenceur activé groupe ${groupId}`, 'success');
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
            this.selectedScale = seq.selectedScale || 'major';
            this.octaveBase = seq.octaveBase || 0;
            this.selectedSwing = seq.selectedSwing || 50;
            this.steps = seq.steps || Array(16).fill(false);
            this.currentMode = seq.currentMode || 'steps';
            this.activeGroup = seq.activeGroup || null;
            
            if (this.isInitialized) {
                this.createControlPanel();
                this.updateInterface();
                this.createGrid();
            }
        }
    }
};

// ===== ÉVÉNEMENTS GLOBAUX =====
window.addEventListener('config-changed', (event) => {
    Sequencer.loadConfig(event.detail);
});