const Sequencer = {
    
    // ===== ÉTAT ===== //
    currentScale: 'C_Major',
    currentOctave: 3,
    currentMode: 'compose', // 'compose' | 'perform'
    steps: Array(16).fill(false),
    playhead: 0,
    isPlaying: false,
    isInitialized: false,
    
    // ===== MAPPING CORRIGÉ GROUPE 3 (HAUT-DROITE) ===== //
    stepPads: [
        61, 62, 63, 64,  // Row 8 (haut)
        53, 54, 55, 56,  // Row 7
        45, 46, 47, 48,  // Row 6  
        37, 38, 39, 40   // Row 5
    ],

    // ===== CONTRÔLES SEQUENCER ===== //
    controlPads: {
        play_stop: 29,    // Play/Stop sequencer
        clear: 30,        // Clear tous les steps
        mode_change: 31,  // Toggle compose/perform
        scale_access: 32  // Accès rapide gammes
    },

    // ===== 16 GAMMES MUSICALES ===== //
    scales: {
        'C_Major': { name: 'C Major', notes: [0, 2, 4, 5, 7, 9, 11] },
        'C_Minor': { name: 'C Minor', notes: [0, 2, 3, 5, 7, 8, 10] },
        'D_Major': { name: 'D Major', notes: [2, 4, 6, 7, 9, 11, 1] },
        'D_Minor': { name: 'D Minor', notes: [2, 4, 5, 7, 9, 10, 0] },
        'E_Minor': { name: 'E Minor', notes: [4, 6, 7, 9, 11, 0, 2] },
        'F_Major': { name: 'F Major', notes: [5, 7, 9, 10, 0, 2, 4] },
        'G_Major': { name: 'G Major', notes: [7, 9, 11, 0, 2, 4, 6] },
        'A_Minor': { name: 'A Minor', notes: [9, 11, 0, 2, 4, 5, 7] },
        'Pentatonic': { name: 'Pentatonic', notes: [0, 2, 4, 7, 9] },
        'Blues': { name: 'Blues', notes: [0, 3, 5, 6, 7, 10] },
        'Dorian': { name: 'Dorian', notes: [0, 2, 3, 5, 7, 9, 10] },
        'Mixolydian': { name: 'Mixolydian', notes: [0, 2, 4, 5, 7, 9, 10] },
        'Phrygian': { name: 'Phrygian', notes: [0, 1, 3, 5, 7, 8, 10] },
        'Lydian': { name: 'Lydian', notes: [0, 2, 4, 6, 7, 9, 11] },
        'Chromatic': { name: 'Chromatic', notes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
        'Whole_Tone': { name: 'Whole Tone', notes: [0, 2, 4, 6, 8, 10] }
    },

    // ===== INITIALISATION ===== //
    init() {
        if (this.isInitialized) return;
        
        this.createInterface();
        this.setupEventListeners();
        this.updateInterface();
        this.isInitialized = true;
        
        App.log('Module Sequencer initialisé', 'success');
    },

    // ===== INTERFACE ===== //
    createInterface() {
        const container = document.querySelector('.sequencer-content');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Section Steps -->
            <div class="steps-section">
                <h3 class="steps-title">16 Steps - Groupe 3 (Haut-Droite)</h3>
                <div class="steps-grid" id="stepsGrid">
                    <!-- Généré par createStepsGrid() -->
                </div>
            </div>
            
            <!-- Section Contrôles -->
            <div class="controls-section">
                <h3 class="controls-title">Contrôles Séquenceur (Pads 29-32)</h3>
                <div class="sequencer-controls" id="sequencerControls">
                    <button class="control-pad" data-pad="29" data-function="play_stop">
                        <span class="pad-number">29</span>
                        <span class="pad-function">Play/Stop</span>
                    </button>
                    <button class="control-pad" data-pad="30" data-function="clear">
                        <span class="pad-number">30</span>
                        <span class="pad-function">Clear</span>
                    </button>
                    <button class="control-pad" data-pad="31" data-function="mode_change">
                        <span class="pad-number">31</span>
                        <span class="pad-function">Mode</span>
                    </button>
                    <button class="control-pad" data-pad="32" data-function="scale_access">
                        <span class="pad-number">32</span>
                        <span class="pad-function">Gammes</span>
                    </button>
                </div>
            </div>
            
            <!-- Section Configuration -->
            <div class="config-section">
                <h3 class="config-title">Configuration</h3>
                
                <div class="sequencer-controls-panel">
                    <div class="control-group">
                        <div class="control-label">Mode Sequencer</div>
                        <div class="mode-selector">
                            <button class="mode-option active" data-mode="compose">Composition</button>
                            <button class="mode-option" data-mode="perform">Performance</button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-label">Actions</div>
                        <div class="action-buttons">
                            <button class="seq-btn" onclick="Sequencer.clearSteps()">Effacer</button>
                            <button class="seq-btn" onclick="Sequencer.randomSteps()">Aléatoire</button>
                            <button class="seq-btn primary" onclick="Sequencer.testPlayhead()">Test Playhead</button>
                            <button class="seq-btn danger" onclick="Sequencer.stopPlayhead()">Stop</button>
                        </div>
                    </div>
                </div>
                
                <div class="scale-info">
                    <div class="scale-info-title">Gamme Actuelle</div>
                    <div id="scaleDisplay">
                        <!-- Généré par updateScaleDisplay() -->
                    </div>
                </div>
                
                <div class="group-mapping">
                    <div class="mapping-title">Mapping Groupe 3 (Haut-Droite)</div>
                    <div class="mapping-grid" id="mappingGrid">
                        <!-- Généré par createMappingDisplay() -->
                    </div>
                </div>
            </div>
        `;
        
        this.createStepsGrid();
        this.createMappingDisplay();
        this.updateScaleDisplay();
        this.setupControlPads();
    },

    createStepsGrid() {
        const grid = document.getElementById('stepsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = 'step';
            step.dataset.stepIndex = i;
            
            const padNumber = this.stepPads[i];
            const midiNote = this.padToMIDI(padNumber);
            const stepNote = this.getStepNote(i);
            
            step.innerHTML = `
                <div class="step-number">${i + 1}</div>
                <div class="step-pad">Pad ${padNumber}</div>
                <div class="step-note">${stepNote}</div>
            `;
            
            // Events
            step.addEventListener('click', () => this.toggleStep(i));
            
            // État initial
            if (this.steps[i]) {
                step.classList.add('programmed');
            }
            
            grid.appendChild(step);
        }
    },

    createMappingDisplay() {
        const grid = document.getElementById('mappingGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Afficher le mapping visuel du Groupe 3 (4x4)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const stepIndex = row * 4 + col;
                const padNumber = this.stepPads[stepIndex];
                
                const pad = document.createElement('div');
                pad.className = 'mapping-pad sequencer';
                pad.innerHTML = `
                    <span class="pad-number">${padNumber}</span>
                    <span class="step-number">S${stepIndex + 1}</span>
                `;
                pad.title = `Step ${stepIndex + 1} → Pad ${padNumber}`;
                grid.appendChild(pad);
            }
        }
    },

    setupControlPads() {
        document.querySelectorAll('.control-pad').forEach(pad => {
            pad.addEventListener('click', () => {
                const func = pad.dataset.function;
                this.executeControlFunction(func);
            });
        });
    },

    executeControlFunction(func) {
        switch(func) {
            case 'play_stop':
                if (this.isPlaying) {
                    this.stopPlayhead();
                } else {
                    this.testPlayhead();
                }
                break;
            case 'clear':
                this.clearSteps();
                break;
            case 'mode_change':
                const newMode = this.currentMode === 'compose' ? 'perform' : 'compose';
                this.setMode(newMode);
                break;
            case 'scale_access':
                this.showScaleSelector();
                break;
        }
    },

    showScaleSelector() {
        // Afficher sélecteur de gammes rapide
        const scales = Object.keys(this.scales);
        const currentIndex = scales.indexOf(this.currentScale);
        const nextIndex = (currentIndex + 1) % scales.length;
        const nextScale = scales[nextIndex];
        
        this.setScale(nextScale);
        App.log(`Gamme suivante: ${this.scales[nextScale].name}`, 'info');
    },

    // ===== EVENT LISTENERS ===== //
    setupEventListeners() {
        // Mode selector
        document.querySelectorAll('.mode-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMode(btn.dataset.mode);
            });
        });
    },

    // ===== PROGRAMMATION STEPS ===== //
    toggleStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= 16) return;
        
        this.steps[stepIndex] = !this.steps[stepIndex];
        this.updateStepDisplay(stepIndex);
        this.saveConfig();
        
        const action = this.steps[stepIndex] ? 'programmé' : 'effacé';
        App.log(`Step ${stepIndex + 1} ${action}`, 'info');
        
        // Feedback MIDI
        this.sendStepFeedback(stepIndex);
    },

    updateStepDisplay(stepIndex) {
        const step = document.querySelector(`[data-step-index="${stepIndex}"]`);
        if (!step) return;
        
        if (this.steps[stepIndex]) {
            step.classList.add('programmed');
            step.classList.add('programming');
            setTimeout(() => step.classList.remove('programming'), 300);
        } else {
            step.classList.remove('programmed');
        }
    },

    // ===== GAMMES & NOTES ===== //
    setScale(scaleKey) {
        if (!this.scales[scaleKey]) return;
        
        this.currentScale = scaleKey;
        this.updateScaleDisplay();
        this.updateStepsNotes();
        this.saveConfig();
        
        App.log(`Gamme changée: ${this.scales[scaleKey].name}`, 'info');
    },

    setOctave(octave) {
        if (octave < 0 || octave > 8) return;
        
        this.currentOctave = octave;
        this.updateStepsNotes();
        this.saveConfig();
        
        App.log(`Octave changée: C${octave}`, 'info');
    },

    getStepNote(stepIndex) {
        const scale = this.scales[this.currentScale];
        if (!scale) return '';
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const scaleNote = scale.notes[stepIndex % scale.notes.length];
        const octaveOffset = Math.floor(stepIndex / scale.notes.length);
        const finalNote = scaleNote;
        const finalOctave = this.currentOctave + octaveOffset;
        
        return `${noteNames[finalNote]}${finalOctave}`;
    },

    updateStepsNotes() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const noteEl = step.querySelector('.step-note');
            if (noteEl) {
                noteEl.textContent = this.getStepNote(index);
            }
        });
    },

    updateScaleDisplay() {
        const display = document.getElementById('scaleDisplay');
        if (!display) return;
        
        const scale = this.scales[this.currentScale];
        if (!scale) return;
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        display.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: 600;">${scale.name}</div>
            <div class="scale-notes">
                ${scale.notes.map((note, index) => `
                    <span class="scale-note ${index === 0 ? 'root' : ''}">
                        ${noteNames[note]}
                    </span>
                `).join('')}
            </div>
        `;
    },

    // ===== MODES ===== //
    setMode(mode) {
        this.currentMode = mode;
        
        // UI mode buttons
        document.querySelectorAll('.mode-option').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Comportement interface
        const content = document.querySelector('.sequencer-content');
        if (content) {
            if (mode === 'perform') {
                content.classList.add('playing');
            } else {
                content.classList.remove('playing');
            }
        }
        
        App.log(`Mode ${mode} activé`, 'info');
    },

    // ===== PLAYHEAD ===== //
    testPlayhead() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.playhead = 0;
        this.setMode('perform');
        
        const playInterval = setInterval(() => {
            this.updatePlayhead();
            this.playhead = (this.playhead + 1) % 16;
            
            // Arrêter après un cycle complet
            if (this.playhead === 0) {
                clearInterval(playInterval);
                this.stopPlayhead();
            }
        }, 250);
        
        App.log('Test playhead démarré', 'info');
    },

    stopPlayhead() {
        this.isPlaying = false;
        this.setMode('compose');
        
        // Enlever playhead de tous les steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('playhead');
        });
        
        App.log('Playhead arrêté', 'info');
    },

    updatePlayhead() {
        // Enlever playhead précédent
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('playhead');
        });
        
        // Ajouter playhead actuel
        const currentStep = document.querySelector(`[data-step-index="${this.playhead}"]`);
        if (currentStep) {
            currentStep.classList.add('playhead');
        }
    },

    // ===== ACTIONS ===== //
    clearSteps() {
        this.steps.fill(false);
        this.updateInterface();
        this.saveConfig();
        
        App.log('Tous les steps effacés', 'info');
    },

    randomSteps() {
        for (let i = 0; i < 16; i++) {
            this.steps[i] = Math.random() > 0.6;
        }
        this.updateInterface();
        this.saveConfig();
        
        const programmedCount = this.steps.filter(Boolean).length;
        App.log(`Steps aléatoires: ${programmedCount}/16 programmés`, 'info');
    },

    // ===== UTILITAIRES ===== //
    padToMIDI(padNumber) {
        const padIndex = padNumber - 1;
        const visualRow = Math.floor(padIndex / 8);
        const col = padIndex % 8;
        return (7 - visualRow) * 8 + col;
    },

    sendStepFeedback(stepIndex) {
        if (!App.isConnected() || typeof MIDI === 'undefined') return;
        
        const padNumber = this.stepPads[stepIndex];
        const midiNote = this.padToMIDI(padNumber);
        const isOn = this.steps[stepIndex];
        
        MIDI.setPadColor(midiNote, isOn ? 'RED' : 'OFF');
    },

    syncToMIDI() {
        this.steps.forEach((isOn, index) => {
            if (isOn) {
                this.sendStepFeedback(index);
            }
        });
        
        App.log('Sequencer synchronisé avec MIDI', 'info');
    },

    updateInterface() {
        this.steps.forEach((_, index) => {
            this.updateStepDisplay(index);
        });
        
        this.updateStepsNotes();
        this.updateScaleDisplay();
    },

    // ===== PREVIEW MIDI ===== //
    handleMIDIPreview(message) {
        const { status, note, velocity } = message;
        
        // Vérifier si c'est un pad du groupe 3
        const stepIndex = this.getStepFromMIDI(note);
        if (stepIndex !== -1 && velocity > 0) {
            this.toggleStep(stepIndex);
            App.log(`Step ${stepIndex + 1} toggleé via MIDI`, 'info');
        }
        
        // Vérifier contrôles sequencer (pads 29-32)
        if (velocity > 0) {
            const controlFunction = this.getControlFromMIDI(note);
            if (controlFunction) {
                this.executeControlFunction(controlFunction);
            }
        }
    },

    getStepFromMIDI(midiNote) {
        for (let i = 0; i < 16; i++) {
            const padNumber = this.stepPads[i];
            const stepMidiNote = this.padToMIDI(padNumber);
            if (stepMidiNote === midiNote) {
                return i;
            }
        }
        return -1;
    },

    getControlFromMIDI(midiNote) {
        const controlMidiNote = this.padToMIDI(29 + Object.keys(this.controlPads).findIndex(key => 
            this.padToMIDI(this.controlPads[key]) === midiNote
        ));
        
        for (const [func, padNumber] of Object.entries(this.controlPads)) {
            if (this.padToMIDI(padNumber) === midiNote) {
                return func;
            }
        }
        return null;
    },

    // ===== CONFIGURATION ===== //
    saveConfig() {
        const config = {
            scale: this.currentScale,
            octave: this.currentOctave,
            mode: this.currentMode,
            steps: [...this.steps]
        };
        
        App.updateConfig('sequencer', config);
    },

    loadConfig(config) {
        if (config.sequencer) {
            const seq = config.sequencer;
            
            if (seq.scale) this.currentScale = seq.scale;
            if (seq.octave !== undefined) this.currentOctave = seq.octave;
            if (seq.mode) this.currentMode = seq.mode;
            if (seq.steps) this.steps = [...seq.steps];
            
            if (this.isInitialized) {
                this.updateInterface();
            }
        }
    },

    getConfig() {
        return {
            scale: this.currentScale,
            octave: this.currentOctave,
            mode: this.currentMode,
            steps: [...this.steps],
            stepPads: [...this.stepPads],
            controlPads: { ...this.controlPads }
        };
    }
};

// ===== EVENT LISTENERS ===== //
window.addEventListener('config-changed', (event) => {
    if (event.detail.sequencer) {
        Sequencer.loadConfig(event.detail);
    }
});

// Gestion MIDI globale
window.addEventListener('midi-message', (event) => {
    Sequencer.handleMIDIPreview(event.detail);
});