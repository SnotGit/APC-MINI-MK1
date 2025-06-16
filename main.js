// main.js - Point d'entrée de l'application (VERSION CORRIGÉE)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // ✅ CORRECTION : Initialisation dans le bon ordre
    
    // 1. D'abord initialiser l'application principale
    if (typeof App !== 'undefined') {
        App.init();
    } else {
        console.error('Module App non trouvé !');
        return;
    }
    
    // 2. Initialiser les modules avec un délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        // Initialiser MIDI
        if (typeof MIDI !== 'undefined') {
            const midiSupported = MIDI.init();
            if (midiSupported) {
                console.log('✅ Module MIDI initialisé');
            } else {
                console.warn('⚠️ Web MIDI non supporté');
                App.log('Web MIDI non supporté dans ce navigateur', 'warning');
            }
        } else {
            console.error('❌ Module MIDI non trouvé');
        }
        
        // Initialiser Pads
        if (typeof Pads !== 'undefined') {
            try {
                Pads.init();
                console.log('✅ Module Pads initialisé');
            } catch (error) {
                console.error('❌ Erreur initialisation Pads:', error);
                App.log('Erreur lors de l\'initialisation des pads', 'error');
            }
        } else {
            console.error('❌ Module Pads non trouvé');
        }
        
        // Initialiser Buttons
        if (typeof Buttons !== 'undefined') {
            try {
                Buttons.init();
                console.log('✅ Module Buttons initialisé');
            } catch (error) {
                console.error('❌ Erreur initialisation Buttons:', error);
                App.log('Erreur lors de l\'initialisation des boutons', 'error');
            }
        } else {
            console.error('❌ Module Buttons non trouvé');
        }
        
        // Vérifier que tous les modules sont bien chargés
        const modules = ['App', 'MIDI', 'Pads', 'Buttons', 'Export'];
        const missingModules = modules.filter(module => typeof window[module] === 'undefined');
        
        if (missingModules.length > 0) {
            console.warn('⚠️ Modules manquants:', missingModules);
            App.log(`Modules manquants: ${missingModules.join(', ')}`, 'warning');
        } else {
            console.log('✅ Tous les modules sont chargés');
            App.log('Interface prête à l\'utilisation', 'info');
        }
        
        // ✅ NOUVEAU : Ajouter des gestionnaires d'événements globaux
        setupGlobalEventHandlers();
        
        // ✅ NOUVEAU : Vérification des éléments DOM critiques
        checkCriticalElements();
        
    }, 100); // Délai de 100ms pour s'assurer que tout est prêt
});

// ✅ NOUVELLE FONCTION : Gestionnaires d'événements globaux
function setupGlobalEventHandlers() {
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', (event) => {
        // Échap pour désélectionner
        if (event.key === 'Escape') {
            if (typeof Pads !== 'undefined' && Pads.selectedPad !== null) {
                Pads.selectPad(Pads.selectedPad); // Désélectionner
            }
            if (typeof Buttons !== 'undefined' && Buttons.selectedButton !== null) {
                Buttons.selectButton(Buttons.selectedButton); // Désélectionner
            }
        }
        
        // Ctrl+S pour sauvegarder
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (typeof App !== 'undefined') {
                App.saveConfig();
                App.log('Configuration sauvegardée (Ctrl+S)', 'info');
            }
        }
        
        // Ctrl+T pour tester MIDI
        if (event.ctrlKey && event.key === 't') {
            event.preventDefault();
            if (typeof App !== 'undefined') {
                App.testMIDI();
            }
        }
    });
    
    // Gestion des erreurs JavaScript globales
    window.addEventListener('error', (event) => {
        console.error('Erreur JavaScript:', event.error);
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Erreur: ${event.error.message}`, 'error');
        }
    });
    
    // Gestion de la fermeture de la page
    window.addEventListener('beforeunload', (event) => {
        // Sauvegarder avant de quitter
        if (typeof App !== 'undefined') {
            App.saveConfig();
        }
        
        // Déconnecter MIDI proprement
        if (typeof MIDI !== 'undefined' && MIDI.isConnected()) {
            MIDI.disconnect();
        }
    });
    
    console.log('✅ Gestionnaires d\'événements globaux configurés');
}

// ✅ NOUVELLE FONCTION : Vérification des éléments DOM critiques
function checkCriticalElements() {
    const criticalElements = [
        { id: 'padGrid', name: 'Grille de pads' },
        { id: 'logTerminal', name: 'Terminal de logs' },
        { id: 'individualConfig', name: 'Configuration individuelle' },
        { id: 'groupMode', name: 'Mode groupe' }
    ];
    
    const missingElements = [];
    
    criticalElements.forEach(element => {
        const el = document.getElementById(element.id);
        if (!el) {
            missingElements.push(element.name);
            console.error(`❌ Élément DOM manquant: ${element.name} (ID: ${element.id})`);
        }
    });
    
    if (missingElements.length > 0) {
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Éléments DOM manquants: ${missingElements.join(', ')}`, 'error');
        }
    } else {
        console.log('✅ Tous les éléments DOM critiques sont présents');
    }
    
    // Vérifier les boutons de contrôle
    const controlButtons = document.querySelectorAll('.control-btn[data-button]');
    if (controlButtons.length < 8) {
        console.warn(`⚠️ Seulement ${controlButtons.length} boutons de contrôle trouvés (8 attendus)`);
        if (typeof App !== 'undefined' && App.log) {
            App.log(`Seulement ${controlButtons.length}/8 boutons de contrôle trouvés`, 'warning');
        }
    }
    
    // Vérifier les options de commandes
    const optionButtons = document.querySelectorAll('.option-btn[data-command]');
    if (optionButtons.length === 0) {
        console.warn('⚠️ Aucun bouton d\'option trouvé');
        if (typeof App !== 'undefined' && App.log) {
            App.log('Aucun bouton d\'option trouvé', 'warning');
        }
    } else {
        console.log(`✅ ${optionButtons.length} boutons d'option trouvés`);
    }
}

// ✅ NOUVELLE FONCTION : Fonction utilitaire pour debugger
window.debugAPC = function() {
    console.log('=== DEBUG APC MINI CONFIGURATOR ===');
    
    // État des modules
    console.log('Modules chargés:');
    ['App', 'MIDI', 'Pads', 'Buttons', 'Export'].forEach(module => {
        console.log(`  ${module}:`, typeof window[module] !== 'undefined' ? '✅' : '❌');
    });
    
    // État de l'application
    if (typeof App !== 'undefined' && App.state) {
        console.log('État App:', App.state);
    }
    
    // État MIDI
    if (typeof MIDI !== 'undefined') {
        console.log('MIDI connecté:', MIDI.isConnected ? MIDI.isConnected() : 'N/A');
        const deviceInfo = MIDI.getDeviceInfo ? MIDI.getDeviceInfo() : null;
        if (deviceInfo) {
            console.log('Appareil MIDI:', deviceInfo);
        }
    }
    
    // Éléments DOM
    console.log('Éléments DOM:');
    const elements = ['padGrid', 'logTerminal', 'individualConfig'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`  ${id}:`, el ? '✅' : '❌');
    });
    
    console.log('=== FIN DEBUG ===');
};

// Message de bienvenue dans la console
console.log(`
    ╔══════════════════════════════════════════╗
    ║        APC MINI MK1 CONFIGURATOR         ║
    ║              Version 1.0                 ║
    ╠══════════════════════════════════════════╣
    ║  Tapez debugAPC() pour les infos debug   ║
    ║  Raccourcis:                             ║
    ║    Ctrl+S : Sauvegarder                  ║
    ║    Ctrl+T : Test MIDI                    ║
    ║    Échap  : Désélectionner               ║
    ╚══════════════════════════════════════════╝
`);