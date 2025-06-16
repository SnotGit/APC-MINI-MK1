# APC Mini MK1 Configurator 🎹

Une interface web standalone pour configurer votre Akai APC Mini MK1 avec Ableton Live.

## 🚀 Installation

1. **Téléchargez** le dossier complet `APC-MINI-MK1`
2. **Placez-le** n'importe où sur votre ordinateur
3. **Ouvrez** `index.html` dans Chrome ou Firefox

## 📋 Fonctionnalités

### Configuration des Pads (0-63)
- Assignez des couleurs aux pads un par un (Vert, Rouge, Jaune)
- Ou assignez les couleurs pads par groupes de 16
- Test en temps réel avec votre APC Mini connecté

### Configuration des Boutons (82-88)
- Choisissez parmi 40+ commandes Ableton
- Transport, Enregistrement, Édition, Navigation, etc.
- Aperçu visuel de votre configuration

### Export One-Click
- Génère un package ZIP complet
- Script Python compatible Live 10/11/12
- Instructions d'installation incluses

## 🎮 Utilisation

### 1. Connecter votre APC Mini
- Cliquez sur "Connecter APC Mini"
- L'interface détecte automatiquement votre contrôleur
- Le statut passe au vert quand connecté

### 2. Configurer les Pads
- **Individuel** : Cliquez sur un pad pour le configurer
- **Groupes** : Assignez rapidement 16 pads d'un coup

### 3. Configurer les Boutons
- Onglet "Boutons de Contrôle"
- Sélectionnez une fonction pour chaque bouton
- Mode shift disponible pour encore plus de fonctions

### 4. Exporter
- Onglet "Exporter"
- Cliquez "Générer le Package d'Installation"
- Un fichier `APC_Mini_Custom.zip` est téléchargé

## 📦 Installation dans Ableton

1. **Décompressez** `APC_Mini_Custom.zip`
2. **Copiez** le dossier dans :
   - **Windows** : `C:\ProgramData\Ableton\Live [version]\Resources\MIDI Remote Scripts\`
   - **Mac** : `/Applications/Ableton Live [version].app/Contents/App-Resources/MIDI Remote Scripts/`
3. **Redémarrez** Ableton Live
4. Dans **Préférences** :
   - Surface de contrôle : `APC_Mini_Custom`
   - Entrée : `APC MINI`
   - Sortie : `APC MINI`


## 🔧 Conseils

### "APC Mini non trouvé"
- Vérifiez que l'APC est branché en USB
- Essayez un autre port USB
- Redémarrez le navigateur

### "Web MIDI non supporté"
- Utilisez Chrome, Edge ou Opera
- Firefox nécessite d'activer Web MIDI dans about:config

### Les LEDs ne s'allument pas
- Vérifiez que l'APC n'est pas en mode Ableton
- Débranchez/rebranchez l'USB
- Cliquez "Mode Test" pour vérifier

## 🤝 Contribution

Ce projet est open source ! Vos contributions sont les bienvenues.

## 📄 Licence

MIT License - Utilisez, modifiez et partagez librement !

---

Fait avec ❤️ pour la communauté Ableton