const Buttons = {
    selectedButton: null,
    currentView: 'normal',
    
    buttonColors: {
        82: '#e74c3c',
        83: '#2ecc71',
        84: '#3498db',
        85: '#f39c12',
        86: '#9b59b6',
        87: '#1abc9c',
        88: '#34495e',
        89: '#ff9800'
    },
    
    buttonConfig: {
        normal: {
            82: '',
            83: '',
            84: '',
            85: '',
            86: '',
            87: '',
            88: ''
        },
        shift: {
            82: '',
            83: '',
            84: '',
            85: '',
            86: '',
            87: '',
            88: ''
        }
    },
    
    availableCommands: [
        { id: 'play_stop', label: 'Play/Stop', group: 'transport' },
        { id: 'session_record', label: 'Session Record', group: 'transport' },
        { id: 'overdub', label: 'Overdub', group: 'transport' },
        { id: 'undo', label: 'Undo', group: 'transport' },
        { id: 'redo', label: 'Redo', group: 'transport' },
        { id: 'tap_tempo', label: 'Tap Tempo', group: 'transport' },
        { id: 'stop_all_clips', label: 'Stop All Clips', group: 'session' },
        { id: 'capture_midi', label: 'Capture MIDI', group: 'session' },
        { id: 'metronome', label: 'Metronome', group: 'session' },
        { id: 'next_scene', label: 'Next Scene', group: 'session' },
        { id: 'previous_scene', label: 'Previous Scene', group: 'session' },
        { id: 'launch_selected_scene', label: 'Launch Scene', group: 'session' },
        { id: 'new_audio_track', label: 'New Audio Track', group: 'editing' },
        { id: 'new_midi_track', label: 'New MIDI Track', group: 'editing' },
        { id: 'duplicate', label: 'Duplicate', group: 'editing' },
        { id: 'delete', label: 'Delete', group: 'editing' },
        { id: 'automation_arm', label: 'Automation Arm', group: 'editing' },
        { id: 'back_to_arrangement', label: 'Back to Arr.', group: 'editing' }
    ],
    
    init() {
        this.attachButtonEvents();
        this.attachOptionEvents();
        this.loadDefaultConfig();
        this.updateDisplay();
    },
    
    attachButtonEvents() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            const buttonNumber = parseInt(btn.dataset.button);
            if (buttonNumber >= 82 && buttonNumber <= 88) {
                
                // Couleur de bordure selon le bouton
                btn.style.borderColor = this.buttonColors[buttonNumber] || '#555';
                
                // Attacher l'événement de clic
                btn.addEventListener('click', () => {
                    this.selectButton(buttonNumber);
                });
            }
        });
        
        // Gérer le bouton Shift (89) séparément
        const shiftBtn = document.querySelector('[data-button="89"]');
        if (shiftBtn) {
            shiftBtn.style.borderColor = this.buttonColors[89];
            shiftBtn.addEventListener('click', () => {
                this.toggleShiftMode();
            });
        }
    },
    
    attachOptionEvents() {
        document.querySelectorAll('.option-btn').forEach(opt => {
            const commandId = opt.dataset.command;
            
            opt.addEventListener('click', () => {
                this.assignCommand(commandId);
                
                // Animation de feedback
                opt.classList.add('clicked');
                setTimeout(() => opt.classList.remove('clicked'), 200);
            });
        });
    },
    
    selectButton(buttonNumber) {
        // Si on clique sur le même bouton, désélectionner
        if (this.selectedButton === buttonNumber) {
            this.selectedButton = null;
        } else {
            this.selectedButton = buttonNumber;
        }
        
        this.updateDisplay();
        
        if (typeof App !== 'undefined' && App.log) {
            const action = this.selectedButton ? 'sélectionné' : 'désélectionné';
            App.log(`Bouton ${buttonNumber} ${action}`, 'info');
        }
    },
    
    assignCommand(commandId) {
        if (!this.selectedButton) {
            if (typeof App !== 'undefined' && App.log) {
                App.log('Sélectionnez d\'abord un bouton', 'warning');
            }
            return;
        }
        
        const config = this.buttonConfig[this.currentView];
        
        // Vérifier si cette commande est déjà assignée
        const existingButton = Object.keys(config).find(
            btn => config[btn] === commandId
        );
        
        if (existingButton && existingButton != this.selectedButton) {
            // Retirer l'ancienne assignation
            config[existingButton] = '';
        }
        
        // Assigner la nouvelle commande
        config[this.selectedButton] = commandId;
        
        if (typeof App !== 'undefined' && App.log) {
            const label = this.getCommandLabel(commandId);
            const mode = this.currentView === 'shift' ? ' (Shift)' : '';
            App.log(`Bouton ${this.selectedButton}${mode} → ${label}`, 'info');
        }
        
        this.updateDisplay();
        this.saveConfig();
        
        // Désélectionner le bouton
        this.selectedButton = null;
        this.updateDisplay();
    },
    
    getCommandLabel(commandId) {
        const command = this.availableCommands.find(c => c.id === commandId);
        return command ? command.label : commandId;
    },
    
    toggleShiftMode() {
        const newView = this.currentView === 'normal' ? 'shift' : 'normal';
        this.setView(newView);
    },
    
    setView(view) {
        this.currentView = view;
        
        // Mettre à jour les boutons de toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            if (btn.textContent.toLowerCase() === view.toLowerCase()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.updateDisplay();
        
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Mode ${view} activé`, 'info');
        }
    },
    
    updateDisplay() {
        const config = this.buttonConfig[this.currentView];
        
        // Mettre à jour les boutons de contrôle
        document.querySelectorAll('.control-btn').forEach(btn => {
            const buttonNum = parseInt(btn.dataset.button);
            
            if (buttonNum >= 82 && buttonNum <= 88) {
                // Retirer les classes
                btn.classList.remove('selected', 'assigned');
                
                // Appliquer la couleur de base
                btn.style.borderColor = this.buttonColors[buttonNum] || '#555';
                
                // Si sélectionné
                if (this.selectedButton === buttonNum) {
                    btn.classList.add('selected');
                }
                
                // Si assigné
                if (config[buttonNum]) {
                    btn.classList.add('assigned');
                    
                    const cmdLabel = this.getCommandLabel(config[buttonNum]);
                    const mode = this.currentView === 'shift' ? ' (Shift)' : '';
                    btn.title = `${cmdLabel}${mode}`;
                } else {
                    const mode = this.currentView === 'shift' ? ' (Shift)' : '';
                    btn.title = `Bouton ${buttonNum}${mode} - Non assigné`;
                }
            }
        });
        
        // Mettre à jour les options
        document.querySelectorAll('.option-btn').forEach(opt => {
            const cmdId = opt.dataset.command;
            
            // Retirer les classes d'assignation
            opt.classList.remove('assigned');
            opt.removeAttribute('data-assigned-to');
            opt.style.borderColor = '';
            
            // Trouver si cette commande est assignée
            const assignedButton = Object.keys(config).find(
                btn => config[btn] === cmdId
            );
            
            if (assignedButton) {
                opt.classList.add('assigned');
                opt.setAttribute('data-assigned-to', assignedButton);
                opt.style.borderColor = this.buttonColors[assignedButton];
                
                const mode = this.currentView === 'shift' ? ' (Shift)' : '';
                opt.title = `Assigné au bouton ${assignedButton}${mode}`;
            } else {
                opt.title = opt.textContent;
            }
        });
        
        // Mettre à jour le bouton Shift
        const shiftBtn = document.querySelector('[data-button="89"]');
        if (shiftBtn) {
            if (this.currentView === 'shift') {
                shiftBtn.classList.add('active');
                shiftBtn.style.background = this.buttonColors[89];
                shiftBtn.style.color = '#000';
            } else {
                shiftBtn.classList.remove('active');
                shiftBtn.style.background = '';
                shiftBtn.style.color = '';
            }
        }
    },
    
    loadDefaultConfig() {
        this.buttonConfig.normal = {
            82: 'play_stop',
            83: 'session_record',
            84: 'overdub',
            85: 'undo',
            86: 'capture_midi',
            87: 'stop_all_clips',
            88: 'tap_tempo'
        };
        
        this.buttonConfig.shift = {
            82: '',
            83: '',
            84: '',
            85: '',
            86: '',
            87: '',
            88: ''
        };
    },
    
    saveConfig() {
        const event = new CustomEvent('config-changed', {
            detail: { buttons: this.buttonConfig }
        });
        window.dispatchEvent(event);
    },
    
    loadConfig(buttonsConfig) {
        if (!buttonsConfig) return;
        
        if (buttonsConfig.normal) {
            this.buttonConfig.normal = { ...this.buttonConfig.normal, ...buttonsConfig.normal };
        }
        if (buttonsConfig.shift) {
            this.buttonConfig.shift = { ...this.buttonConfig.shift, ...buttonsConfig.shift };
        }
        
        if (!buttonsConfig.normal && !buttonsConfig.shift) {
            this.buttonConfig.normal = { ...this.buttonConfig.normal, ...buttonsConfig };
        }
        
        this.updateDisplay();
    },
    
    getConfig() {
        return this.buttonConfig;
    }
};