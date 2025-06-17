
const Export = {
    
    // Générer le package complet
    async generatePackage(config) {
        try {
            // Vérifier JSZip
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }
            
            const zip = new JSZip();
            
            // Fichiers Python
            zip.file('__init__.py', this.generateInit());
            zip.file('APC_Mini_Custom.py', this.generateScript(config));
            zip.file('README.txt', this.generateReadme());
            
            // Générer et télécharger
            const content = await zip.generateAsync({type: 'blob'});
            this.downloadFile(content, 'APC_Mini_Custom.zip');
            
            return true;
        } catch (error) {
            console.error('Erreur génération:', error);
            throw error;
        }
    },
    
    // Charger JSZip si nécessaire
    loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Fichier __init__.py
    generateInit() {
        return `# APC Mini MK1 Custom Script
from .APC_Mini_Custom import APC_Mini_Custom
__all__ = ['APC_Mini_Custom']
`;
    },
    
    // Script principal Python
    generateScript(config) {
        return `# APC Mini MK1 Custom Script
# Compatible Ableton Live 10/11/12

import Live
from _Framework.ControlSurface import ControlSurface
from _Framework.InputControlElement import MIDI_NOTE_TYPE, MIDI_CC_TYPE
from _Framework.ButtonElement import ButtonElement
from _Framework.EncoderElement import EncoderElement
from _Framework.SessionComponent import SessionComponent
from _Framework.TransportComponent import TransportComponent
from _Framework.MixerComponent import MixerComponent

class APC_Mini_Custom(ControlSurface):
    
    def __init__(self, c_instance):
        super(APC_Mini_Custom, self).__init__(c_instance)
        
        with self.component_guard():
            self._setup_transport()
            self._setup_mixer()
            self._setup_session()
            self._setup_custom_buttons()
    
    def _setup_transport(self):
        self._transport = TransportComponent()
    
    def _setup_mixer(self):
        self._mixer = MixerComponent(8)
        
        # Faders (48-56)
        for i in range(8):
            strip = self._mixer.channel_strip(i)
            fader = EncoderElement(MIDI_CC_TYPE, 0, 48 + i, Live.MidiMap.MapMode.absolute)
            strip.set_volume_control(fader)
        
        # Track select + ARM (64-71)
        for i in range(8):
            button = ButtonElement(True, MIDI_NOTE_TYPE, 0, 64 + i)
            strip = self._mixer.channel_strip(i)
            strip.set_select_button(button)
            strip.set_arm_button(button)
    
    def _setup_session(self):
        self._session = SessionComponent(8, 8)
        self._session.set_offsets(0, 0)
        
        # Pads (0-63)
        for row in range(8):
            for col in range(8):
                note = (7 - row) * 8 + col
                button = ButtonElement(True, MIDI_NOTE_TYPE, 0, note)
                button.set_on_off_values(1, 0)
                self._session.scene(row).clip_slot(col).set_launch_button(button)
    
    def _setup_custom_buttons(self):
        # Boutons personnalisés selon config
        buttons = ${JSON.stringify(config.buttons, null, 8)}
        
        for note, command in buttons.items():
            note = int(note)
            button = ButtonElement(True, MIDI_NOTE_TYPE, 0, note)
            
            if command == 'play_stop':
                self._transport.set_play_button(button)
            elif command == 'session_record':
                self._transport.set_record_button(button)
            elif command == 'stop_all_clips':
                self._transport.set_stop_button(button)
            elif command == 'tap_tempo':
                self._transport.set_tap_tempo_button(button)
            elif command == 'undo':
                button.add_value_listener(self._undo)
            elif command == 'capture_midi':
                button.add_value_listener(self._capture_midi)
    
    def _undo(self, value):
        if value and self.song().can_undo:
            self.song().undo()
    
    def _capture_midi(self, value):
        if value:
            self.song().capture_midi()
    
    def disconnect(self):
        super(APC_Mini_Custom, self).disconnect()
`;
    },
    
    // README
    generateReadme() {
        return `APC Mini MK1 Custom Script
===========================

INSTALLATION:
1. Copiez le dossier dans:
   Windows: C:\\ProgramData\\Ableton\\Live [version]\\Resources\\MIDI Remote Scripts\\
   Mac: /Applications/Ableton Live [version].app/Contents/App-Resources/MIDI Remote Scripts/

2. Redémarrez Ableton Live

3. Dans Préférences > MIDI:
   - Surface: APC_Mini_Custom
   - Input: APC MINI  
   - Output: APC MINI

UTILISATION:
- Pads 0-63: Contrôle clips session 8x8
- Faders 48-56: Volume tracks 1-8 + master
- Boutons 64-71: Sélection + armement tracks
- Boutons 82-89: Fonctions personnalisées
- Bouton 98: Shift

Bon mix !
`;
    },
    
    // Télécharger fichier
    downloadFile(content, filename) {
        const a = document.createElement('a');
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};