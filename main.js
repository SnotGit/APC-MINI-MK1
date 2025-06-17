// main.js - Point d'entrée simple

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'application principale
    if (typeof App !== 'undefined') {
        App.init();
    }
    
    // Initialiser les modules avec un délai
    setTimeout(() => {
        if (typeof MIDI !== 'undefined') {
            MIDI.init();
        }
        
        if (typeof Pads !== 'undefined') {
            Pads.init();
        }
        
        if (typeof Buttons !== 'undefined') {
            Buttons.init();
        }
    }, 100);
});

// Gestion des raccourcis clavier
document.addEventListener('keydown', (event) => {
    // Échap pour désélectionner
    if (event.key === 'Escape') {
        if (typeof Pads !== 'undefined' && Pads.selectedPad !== null) {
            Pads.selectPad(Pads.selectedPad);
        }
        if (typeof Buttons !== 'undefined' && Buttons.selectedButton !== null) {
            Buttons.selectButton(Buttons.selectedButton);
        }
    }
    
    // Ctrl+S pour sauvegarder
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (typeof App !== 'undefined') {
            App.saveConfig();
        }
    }
});

// Sauvegarde avant fermeture
window.addEventListener('beforeunload', () => {
    if (typeof App !== 'undefined') {
        App.saveConfig();
    }
    
    if (typeof MIDI !== 'undefined' && MIDI.isConnected()) {
        MIDI.disconnect();
    }
});