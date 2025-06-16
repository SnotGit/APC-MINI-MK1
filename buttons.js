// buttons.js - Gestion de la configuration des boutons 82-88

const Buttons = {
    // État actuel
    selectedButton: null,
    buttonColors: {
        82: '#e74c3c',  // Rouge
        83: '#2ecc71',  // Vert
        84: '#3498db',  // Bleu
        85: '#f39c12',  // Orange
        86: '#9b59b6',  // Violet
        87: '#1abc9c',  // Turquoise
        88: '#34495e'   // Gris foncé
    },
    
    // Groupes de commandes organisés en 3 colonnes
    commandGroups: [
        {
            title: 'OPTIONS 1',
            commands: [
                { id: 'play_stop', label: 'Play/Stop' },
                { id: 'session_record', label: 'Session Record' },
                { id: 'overdub', label: 'Overdub' },
                { id: 'undo', label: 'Undo' },
                { id: 'redo', label: 'Redo' },
                { id: 'tap_tempo', label: 'Tap Tempo' }
            ]
        },
        {
            title: 'OPTIONS 2',
            commands: [
                { id: 'stop_all_clips', label: 'Stop All Clips' },
                { id: 'capture_midi', label: 'Capture MIDI' },
                { id: 'metronome', label: 'Metronome' },
                { id: 'next_scene', label: 'Next Scene' },
                { id: 'previous_scene', label: 'Previous Scene' },
                { id: 'launch_selected_scene', label: 'Launch Scene' }
            ]
        },
        {
            title: 'OPTIONS 3',
            commands: [
                { id: 'new_audio_track', label: 'New Audio Track' },
                { id: 'new_midi_track', label: 'New MIDI Track' },
                { id: 'duplicate', label: 'Duplicate' },
                { id: 'delete', label: 'Delete' },
                { id: 'automation_arm', label: 'Automation Arm' },
                { id: 'back_to_arrangement', label: 'Back to Arr.' }
            ]
        }
    ],
    
    // Configuration actuelle
    buttonConfig: {
        82: '',
        83: '',
        84: '',
        85: '',
        86: '',
        87: '',
        88: ''
    },
    
    // Initialisation
    init() {
        // Récupérer le conteneur des boutons
        const container = document.getElementById('tab-buttons');
        if (!container) return;

        // Créer la section des boutons de contrôle
        const controlButtons = document.createElement('div');
        controlButtons.className = 'control-buttons';
        
        // Créer les boutons 82-88
        for (let i = 82; i <= 88; i++) {
            const btn = document.createElement('div');
            btn.className = 'control-btn';
            btn.dataset.id = i;
            btn.style.borderColor = this.buttonColors[i];
            btn.innerHTML = `Button ${i}`;
            btn.onclick = () => this.selectButton(i);
            controlButtons.appendChild(btn);
        }
        container.appendChild(controlButtons);

        // Créer les colonnes d'options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        this.commandGroups.forEach(group => {
            const column = document.createElement('div');
            column.className = 'options-column';
            
            const title = document.createElement('h3');
            title.textContent = group.title;
            column.appendChild(title);
            
            group.commands.forEach(cmd => {
                const option = document.createElement('div');
                option.className = 'option-btn';
                option.dataset.id = cmd.id;
                option.textContent = cmd.label;
                option.onclick = () => this.assignCommand(cmd.id);
                column.appendChild(option);
            });
            
            optionsContainer.appendChild(column);
        });
        
        container.appendChild(optionsContainer);
    },
    
    // Sélectionner un bouton
    selectButton(buttonNumber) {
        // Si on clique sur le même bouton, désélectionner
        if (this.selectedButton === buttonNumber) {
            this.selectedButton = null;
        } else {
            this.selectedButton = buttonNumber;
        }
        
        this.updateDisplay();
        App.log(`Bouton ${buttonNumber} sélectionné`, 'info');
    },
    
    // Assigner une commande au bouton sélectionné
    assignCommand(commandId) {
        if (!this.selectedButton) {
            App.log('Sélectionnez d\'abord un bouton', 'warning');
            return;
        }
        
        // Vérifier si cette commande est déjà assignée
        const existingButton = Object.keys(this.buttonConfig).find(
            btn => this.buttonConfig[btn] === commandId
        );
        
        if (existingButton && existingButton != this.selectedButton) {
            // Retirer l'ancienne assignation
            this.buttonConfig[existingButton] = '';
        }
        
        // Assigner la nouvelle commande
        this.buttonConfig[this.selectedButton] = commandId;
        
        App.log(`Bouton ${this.selectedButton} → ${this.getCommandLabel(commandId)}`, 'info');
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        this.saveConfig();
        
        // Désélectionner le bouton
        this.selectedButton = null;
        this.updateDisplay();
    },
    
    // Obtenir le label d'une commande
    getCommandLabel(commandId) {
        for (const group of this.commandGroups) {
            const cmd = group.commands.find(c => c.id === commandId);
            if (cmd) return cmd.label;
        }
        return commandId;
    },
    
    // Mettre à jour l'affichage
    updateDisplay() {
        // Mettre à jour les boutons
        document.querySelectorAll('.control-button').forEach(btn => {
            const buttonNum = parseInt(btn.dataset.button);
            
            // Style de base
            btn.classList.remove('selected', 'assigned');
            btn.style.borderColor = this.buttonColors[buttonNum];
            
            // Si sélectionné
            if (this.selectedButton === buttonNum) {
                btn.classList.add('selected');
            }
            
            // Si assigné
            if (this.buttonConfig[buttonNum]) {
                btn.classList.add('assigned');
                
                // Afficher la fonction assignée
                const cmdLabel = this.getCommandLabel(this.buttonConfig[buttonNum]);
                btn.title = cmdLabel;
            } else {
                btn.title = `Bouton ${buttonNum} - Non assigné`;
            }
        });
        
        // Mettre à jour les options
        document.querySelectorAll('.option-button').forEach(opt => {
            const cmdId = opt.dataset.command;
            opt.style.borderColor = '';
            opt.classList.remove('assigned');
            
            // Trouver si cette commande est assignée
            const assignedButton = Object.keys(this.buttonConfig).find(
                btn => this.buttonConfig[btn] === cmdId
            );
            
            if (assignedButton) {
                opt.style.borderColor = this.buttonColors[assignedButton];
                opt.classList.add('assigned');
                opt.title = `Assigné au bouton ${assignedButton}`;
            }
        });
        
        this.updatePreview();
    },
    
    // Mettre à jour l'aperçu
    updatePreview() {
        const preview = document.getElementById('buttons-preview-grid');
        if (!preview) return;
        
        preview.innerHTML = '';
        
        // Créer l'aperçu pour chaque bouton
        for (let i = 82; i <= 88; i++) {
            const button = document.createElement('div');
            button.className = 'preview-button';
            
            const command = this.buttonConfig[i];
            const label = command ? this.getCommandLabel(command) : 'Non assigné';
            
            button.innerHTML = `
                <div class="preview-button-visual" style="background: ${this.buttonColors[i]};">${i}</div>
                <div class="preview-button-label">Bouton ${i}</div>
                <div class="preview-button-function">${label}</div>
            `;
            
            preview.appendChild(button);
        }
        
        // Ajouter le bouton Shift
        const shiftButton = document.createElement('div');
        shiftButton.className = 'preview-button';
        shiftButton.innerHTML = `
            <div class="preview-button-visual" style="background: #ff9800;">89</div>
            <div class="preview-button-label">Bouton 89</div>
            <div class="preview-button-function">Shift</div>
        `;
        preview.appendChild(shiftButton);
    },
    
    // Sauvegarder la configuration
    saveConfig() {
        const event = new CustomEvent('config-changed', {
            detail: { buttons: this.buttonConfig }
        });
        window.dispatchEvent(event);
    },
    
    // Charger une configuration
    loadConfig(buttonsConfig) {
        if (!buttonsConfig) return;
        
        this.buttonConfig = buttonsConfig;
        this.createButtonForm();
        this.updatePreview();
    },
    
    // Obtenir la configuration pour l'export
    getConfig() {
        return this.buttonConfig;
    }
};

