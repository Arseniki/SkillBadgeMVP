# 🎓 SkillBadge - Certification Blockchain pour les Talents du Burkina Faso

[![MIABE Hackathon 2026](https://img.shields.io/badge/MIABE-2026-009E60)](https://miabehackathon.com)
[![License](https://img.shields.io/badge/License-MIT-EFB034)](LICENSE)
[![Blockchain](https://img.shields.io/badge/Blockchain-Polygon-009E60)](https://polygon.technology)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev)

---

## 📌 À propos du projet

SkillBadge est une plateforme de certification blockchain conçue pour répondre à une fracture structurelle profonde dans l'écosystème technologique du Burkina Faso : des milliers de jeunes développeurs, designers et techniciens se forment de façon autonome, mais restent invisibles aux yeux des recruteurs faute de certifications formelles reconnues.

**Notre solution** : des badges de compétences numériques sous forme de NFTs (Soulbound Tokens), émis par des formateurs habilités, stockés sur la blockchain Polygon, et vérifiables en quelques secondes par n'importe quel recruteur.

### 🎯 Objectifs

| Objectif | Description |
|----------|-------------|
| 🏅 **Apprenant** | Prouver ses compétences de manière infalsifiable |
| 👨‍🏫 **Formateur** | Émettre des certifications numériques sur blockchain |
| 🏢 **Recruteur** | Vérifier instantanément les compétences des candidats |
| 🌍 **Écosystème** | Rendre visible les talents numériques du Burkina Faso |

---

## 📊 Le problème en chiffres

| Indicateur | Valeur | Source |
|------------|--------|--------|
| Jeunes formés au numérique par an (voie informelle) | **15 000+** | Enquête MIABE 2025 |
| Taux de certification reconnue | **< 5%** | ANPTIC 2024 |
| Recruteurs ayant du mal à évaluer les autodidactes | **70%** | Enquête MIABE 2023 |
| Hausse de l'employabilité avec certification blockchain | **+40%** | Benchmark Afrique de l'Est |

---

## 🚀 Fonctionnalités

### 👨‍🎓 Côté Apprenant
- Dashboard personnel avec progression
- Collection de badges obtenus (niveaux Débutant/Intermédiaire/Avancé)
- QR code et lien unique pour partager son portfolio
- Export PDF du portfolio
- Partage sur WhatsApp, LinkedIn, Email
- Notifications en temps réel
- Badges recommandés par l'IA

### 👨‍🏫 Côté Formateur
- Création de badges sur la blockchain (simulation Polygon)
- Attribution de badges aux apprenants
- Tableau de bord avec KPI (badges émis, apprenants)
- Export CSV des badges créés
- Historique des transactions
- Aperçu en direct des badges avant création
- 🔌 **Connexion MetaMask pour transactions réelles**

### 🏢 Côté Recruteur
- Vérification instantanée par adresse wallet
- Scan de QR code (simulation)
- Recherche manuelle par nom
- Score de confiance du candidat
- Shortlist des candidats
- Export PDF du profil
- 🔌 **Vérification on-chain réelle**

### 🎨 Général
- 🎨 Thème clair/sombre avec mémorisation
- 📱 Design responsive (mobile, tablette, desktop)
- 💾 Stockage persistant avec localStorage
- 🔗 Simulation de transactions blockchain
- 🔌 Connexion réelle à Polygon Amoy via MetaMask

---

## 🛠️ Technologies utilisées

| Catégorie | Technologie | Version | Utilisation |
|-----------|-------------|---------|-------------|
| **Front-end** | React | 18.2.0 | Framework UI |
| **Build tool** | Vite | 4.4.5 | Développement et build |
| **Styling** | CSS-in-JS | - | Thème clair/sombre |
| **Blockchain** | Polygon Amoy | Testnet | Réseau blockchain |
| **Wallet** | MetaMask | - | Connexion utilisateur |
| **Interaction** | ethers.js | 5.7.2 | Transactions blockchain |
| **Persistance** | localStorage | - | Stockage local |

---

## 📁 Structure du projet
SkillBadge/
│
├── index.html # Page d'entrée
├── package.json # Dépendances
├── vite.config.js # Configuration Vite
│
├── src/
│ ├── main.jsx # Point d'entrée React
│ ├── App.jsx # Composant principal (tout-en-un)
│ ├── blockchain.js # Intégration blockchain (MetaMask + Polygon)
│ │
│ └── (composants intégrés dans App.jsx)
│
└── node_modules/ # Dépendances


> **Note :** L'application est actuellement en version "tout-en-un" dans `App.jsx` pour simplifier le développement. Un découpage en composants séparés est prévu pour la version de production.

---

## 🔐 Identifiants de test

| Rôle | Email / Identifiant | Mot de passe |
|------|---------------------|--------------|
| **Apprenant** | `oumar@skillbadge.bf` | `123456` |
| **Apprenant** | `aminata@skillbadge.bf` | `123456` |
| **Formateur** | `koanda@codelab.bf` | `123456` |
| **Recruteur** | `recruteur@skillbadge.bf` | `123456` |

> 💡 Les recruteurs peuvent aussi accéder sans authentification via le portail dédié.

---

## 🚀 Installation et exécution en local

### Prérequis
- Node.js 18+ ou 20+
- npm ou yarn
- Navigateur moderne (Chrome, Firefox, Edge)
- Extension MetaMask (optionnel pour la blockchain réelle)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/ton-pseudo/skillbadge.git
cd skillbadge

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir le navigateur à l'adresse
http://localhost:3000
