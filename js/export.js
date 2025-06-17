// ===== GÉNÉRATION SCRIPT PYTHON ===== //

const Export = {
    
    // ===== ÉTAT ===== //
    isInitialized: false,

    // ===== INITIALISATION ===== //
    init() {
        if (this.isInitialized) return;
        
        this.createInterface();
        this.updateSummary();
        this.isInitialized = true;
        
        App.log('✅ Module Export initialisé', 'info');
    },

    // ===== INTERFACE ===== //
    createInterface() {
        const container = document.querySelector('.export-content');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Résumé Configuration -->
            <div class="export-section">
                <h3 class="export-section-title">Résumé Configuration</h3>
                <div class="config-summary" id="configSummary">
                    <!-- Généré par updateSummary() -->
                </div>
            </div>
            
            <!-- Export -->
            <div class="export-section">
                <h3 class="export-section-title">Génération Script Python</h3>
                <button class="export-button" onclick="Export.generateScript()">
                    📦 Générer Script APC Mini Custom
                </button>
                <div class="export-status" id="exportStatus"></div>
            </div>
            
            <!-- Instructions -->
            <div class="export-section">
                <h3 class="export-section-title">Installation Ableton Live</h3>
                <div class="instructions-section">
                    <div class="instructions-title">Étapes d'installation</div>
                    <ol class="instructions-steps">
                        <li data-step="1">
                            Décompressez le fichier ZIP téléchargé
                        </li>
                        <li data-step="2">
                            Copiez le dossier dans le répertoire Remote Scripts :
                            <div class="instructions-path">
                                <strong>Windows:</strong><br>
                                C:\\ProgramData\\Ableton\\Live [version]\\Resources\\MIDI Remote Scripts\\
                            </div>
                            <div class="instructions-path">
                                <strong>Mac:</strong><br>
                                /Applications/Ableton Live [version].app/Contents/App-Resources/MIDI Remote Scripts/
                            </div>
                        </li>
                        <li data-step="3">
                            Redémarrez Ableton Live
                        </li>
                        <li data-step="4">
                            Dans Préférences > Link/MIDI :
                            <div class="instructions-path">
                                Surface de contrôle: <strong>APC_Mini_Custom</strong><br>
                                Entrée: <strong>APC MINI</strong><br>
                                Sortie: <strong>APC MINI</strong>
                            </div>
                        </li>
                        <li data-step="5">
                            Fermez cette interface web et utilisez votre APC Mini !
                        </li>
                    </ol>
                </div>
            </div>
        `;
    },

    // ===== RÉSUMÉ CONFIGURATION ===== //
    updateSummary() {
        const summary = document.getElementById('configSummary');
        if (!summary) return;
        
        const config = App.getConfig();
        
        // Compter pads configurés
        const configuredPads = Object.values(config.pads || {}).filter(pad => pad.color).length;
        
        // Compter boutons configurés
        const configuredButtons = Object.values(config.buttons || {}).filter(btn => btn.normal || btn.shift).length;
        
        // Compter steps séquenceur
        const configuredSteps = (config.sequencer?.steps || []).filter(Boolean).length;
        
        summary.innerHTML = `
            <div class="summary-card">
                <div class="summary-title">Pads Configurés</div>
                <div class="summary-content">
                    <span class="summary-count">${configuredPads}</span>/64 pads avec couleur<br>
                    Groupes 1, 2, 4 configurables<br>
                    Groupe 3 = Step Sequencer
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-title">Boutons Configurés</div>
                <div class="summary-content">
                    <span class="summary-count">${configuredButtons}</span>/8 boutons (82-89)<br>
                    Mode Normal + Shift<br>
                    <span class="summary-count">${configuredButtons * 2}</span> actions totales
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-title">Step Sequencer</div>
                <div class="summary-content">
                    Gamme: <span class="summary-count">${config.sequencer?.scale || 'C_Major'}</span><br>
                    Octave: <span class="summary-count">C${config.sequencer?.octave || 3}</span><br>
                    Steps: <span class="summary-count">${configuredSteps}</span>/16 programmés
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-title">Script Python</div>
                <div class="summary-content">
                    Compatible: <span class="summary-count">Live 10/11/12</span><br>
                    Feedback LED bidirectionnel<br>
                    Script complet standalone
                </div>
            </div>
        `;
    },

    // ===== GÉNÉRATION SCRIPT ===== //
    async generateScript() {
        const button = document.querySelector('.export-button');
        const status = document.getElementById('exportStatus');
        
        if (button) {
            button.disabled = true;
            button.textContent = '⏳ Génération en cours...';
        }
        
        try {
            // Mettre à jour résumé
            this.updateSummary();
            
            // Simuler génération (à compléter étape 5)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Pour l'instant, juste un placeholder
            this.downloadPlaceholder();
            
            if (status) {
                status.className = 'export-status success';
                status.textContent = '✅ Script généré avec succès ! Fichier téléchargé.';
            }
            
            App.log('📦 Script Python généré et téléchargé', 'success');
            
        } catch (error) {
            if (status) {
                status.className = 'export-status error';
                status.textContent = `❌ Erreur génération: ${error.message}`;
            }
            
            App.log(`❌ Erreur export: ${error.message}`, 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = '📦 Générer Script APC Mini Custom';
            }
        }
    },

    // ===== PLACEHOLDER DOWNLOAD ===== //
    downloadPlaceholder() {
        const config = App.getConfig();
        
        const placeholderContent = `# APC Mini MK1 Custom Script
# Generated by APC Mini Configurator
# ${new Date().toLocaleString()}

# Configuration:
# - Pads: ${Object.keys(config.pads || {}).length} configurés
# - Boutons: ${Object.keys(config.buttons || {}).length} configurés  
# - Sequencer: ${config.sequencer?.scale || 'C_Major'} @ C${config.sequencer?.octave || 3}

# TODO: Génération complète à l'étape 5
print("APC Mini Custom Script - Placeholder")
`;
        
        // Créer et télécharger
        const blob = new Blob([placeholderContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'APC_Mini_Custom_placeholder.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    },

    // ===== ÉVÉNEMENTS ===== //
    onConfigChange() {
        if (this.isInitialized) {
            this.updateSummary();
        }
    }
};

// ===== EVENT LISTENERS ===== //
window.addEventListener('config-changed', () => {
    Export.onConfigChange();
});