# GAIT / Analyzer

> Analyse cinématique de la course à pied dans le navigateur — MediaPipe Pose, calcul d'angles articulaires 3D, détection de foulée et diagnostic de technique en temps réel.

![status](https://img.shields.io/badge/status-prototype-orange)
![stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20ES%20modules-blue)
![runtime](https://img.shields.io/badge/runtime-MediaPipe%20Pose-4ad6e0)

---

## Aperçu

GAIT/Analyzer extrait les angles articulaires (genoux, hanches, chevilles + inclinaison du tronc) image par image à partir d'une **caméra live** ou d'une **vidéo uploadée**, détecte les foulées, calcule la cadence, et produit un **diagnostic de technique** assorti de conseils correctifs.

Tout tourne **100 % côté navigateur** : aucune image, aucun landmark, aucun export ne quitte la machine.

### Cas d'usage

- Auto-analyse de sa propre foulée à partir d'une vidéo smartphone (vue de profil).
- Comparaison avant/après changement de chaussures, de cadence ou de technique.
- Export brut (CSV / JSON) pour analyse offline dans Python / R / Excel.

---

## Démo & fonctionnalités

| Module | Ce qu'il fait |
| --- | --- |
| **Capture** | Caméra live (`getUserMedia`) ou fichier vidéo local. Timeline avec scrub : le squelette se redessine sur chaque frame quand tu navigues la timeline en pause. |
| **Squelette** | Overlay canvas — 33 landmarks MediaPipe Pose, jambes colorées L/R, points clés mis en évidence, label d'angle accolé à chaque articulation. |
| **Angles instantanés** | 6 angles articulaires (genou L/R, hanche L/R, cheville L/R) + min / moyenne / max courants. |
| **Dérivées** | Inclinaison du tronc, asymétries L/R, ROM des genoux, nombre de foulées détectées. |
| **Timeline** | 3 courbes (genou / hanche / cheville) sur fenêtre glissante 6 s. |
| **Analyse & conseils** | Score sur 100 + diagnostics par critère (cadence, tronc, flexion swing, ROM, asymétries) avec conseil de correction concret. |
| **Export** | CSV (1 ligne / frame, 6 angles + tronc) ou JSON (landmarks complets + stats). |

---

## Pipeline

```
┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────────┐
│  <video>     │───▶│  MediaPipe     │───▶│  computeAng  │───▶│  store       │
│  caméra /    │    │  Pose (33 lm)  │    │  angle3D()   │    │  history +   │
│  upload      │    │                │    │  trunkLean() │    │  cycleHist   │
└──────────────┘    └────────────────┘    └──────────────┘    └──────┬───────┘
                                                                     │
              ┌──────────────────────┬──────────────────────┬────────┴─────────┐
              ▼                      ▼                      ▼                  ▼
       ┌────────────┐         ┌────────────┐         ┌────────────┐     ┌────────────┐
       │  overlay   │         │  metrics   │         │  charts    │     │  analysis  │
       │  canvas    │         │  panel     │         │  (6 s)     │     │  rules     │
       └────────────┘         └────────────┘         └────────────┘     └────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  stride        │
                              │  detector      │
                              │  → cadence     │
                              └────────────────┘
```

---

## Méthodologie

### Calcul des angles

Loi du cosinus sur vecteurs **3D normalisés** entre 3 landmarks (`A-B-C`, vertex en `B`) :

```
        AB · CB
cos θ = ─────────
       |AB| · |CB|
```

Articulations mesurées :

| Angle | Triplet de landmarks |
| --- | --- |
| Genou L | hip — knee — ankle (gauche) |
| Genou R | hip — knee — ankle (droit) |
| Hanche L | shoulder — hip — knee (gauche) |
| Hanche R | shoulder — hip — knee (droit) |
| Cheville L | knee — ankle — foot index (gauche) |
| Cheville R | knee — ankle — foot index (droit) |
| Tronc | angle hip→shoulder vs vertical |

Un angle n'est conservé que si la **visibilité** des 3 landmarks dépasse `0.4` (sinon `null`).

### Détection de foulée

Recherche de **minima locaux** sur le signal de flexion du genou gauche : on regarde 3 frames en arrière et on requiert une chute > 15° par rapport aux frames voisines, avec un debounce de 300 ms. La cadence est dérivée de la moyenne mobile des intervalles inter-foulées (× 2, puisque l'on ne compte qu'une jambe).

### Diagnostics

7 règles évaluent l'allure et retournent chacune `good` / `warn` / `bad` + conseil :

| Critère | Cible | Source |
| --- | --- | --- |
| Cadence | 170–185 SPM | Heiderscheit et al., *Med. Sci. Sports Exerc.* (2011) |
| Inclinaison du tronc | 5–10° vers l'avant (depuis chevilles) | Pose forward-lean en endurance |
| Flexion genou swing | 70–115° (angle min) | Repli passif talon-fesse |
| ROM genou | 55–85° | Foulée dynamique |
| ROM hanche | 30–55° | Moteur principal de la course |
| Asymétrie L/R genou | < 5 % | Risque blessure / compensation |
| Asymétrie L/R hanche | < 5 % | Stabilité bassin (fessier moyen) |

Score = moyenne pondérée (`good`=100, `warn`=60, `bad`=20).

---

## Limites

- **Vue de profil obligatoire**. De face / dos, les angles 2D sagittaux n'ont pas de sens.
- **MediaPipe sous-estime la flexion plantaire / dorsale** (landmarks pied peu précis). Interpréter la cheville avec prudence.
- **2D depth `z` approximatif** — l'angle 3D reste majoritairement piloté par la projection image.
- **Cadence** suppose une foulée régulière. Marche, sprint, ou changements brutaux d'allure → débordement des seuils de détection.
- **Diagnostics indicatifs**. Aucun substitut à une analyse podologique ou kiné.

Pour des résultats fiables : profil latéral, sujet de plein corps cadré, tapis de course, lumière homogène, fond contrasté.

---

## Démarrage

### Prérequis

- Navigateur Chromium-based récent (Chrome / Edge / Brave) ou Firefox 100+.
- Connexion internet au premier chargement (CDN MediaPipe).
- Caméra (pour le mode live) ou une vidéo locale.

### Lancement

L'app utilise les **modules ES natifs** — il faut un serveur HTTP, pas un `file://`.

```bash
# option 1 — Python (préinstallé sur macOS/Linux)
python3 -m http.server 8080

# option 2 — Node (npx, pas d'install)
npx serve .

# option 3 — VS Code : extension "Live Server"
```

Puis ouvre `http://localhost:8080/`.

### Utilisation

1. Clique **▶ CAMÉRA LIVE** ou **⬆ UPLOAD VIDÉO**.
2. Place-toi de profil (caméra live), ou choisis une vidéo de profil.
3. Laisse passer **2–3 foulées** pour que les statistiques se stabilisent.
4. Consulte le panneau **ANALYSE & CONSEILS** à droite.
5. Exporte les données brutes via **⬇ CSV / JSON** si besoin.

En mode vidéo, la timeline supporte le **scrub** : pause + déplacement du curseur = le squelette se redessine sur la frame visée.

---

## Architecture

```
Gait-Analyzer/
├── index.html                 # markup pur, charge styles + module d'entrée
├── styles/
│   ├── base.css               # design tokens, reset, layout
│   ├── components.css         # panels, boutons, stage, joint cards, charts
│   └── analysis.css           # panneau diagnostic + score
└── src/
    ├── main.js                # entry — wiring + onResults pipeline
    ├── config.js              # constantes (landmarks, palette, seuils)
    ├── state.js               # store mutable + resetState()
    ├── core/
    │   ├── math.js            # angle3D, trunkLean, computeAngles
    │   ├── pose.js            # createPose() — wrapper MediaPipe
    │   └── stride.js          # détection foulée + cadence
    ├── ui/
    │   ├── dom.js             # $, video, overlay, DOM_MAP
    │   ├── overlay.js         # drawSkeleton, drawAngleLabels
    │   ├── metrics.js         # updateMetrics (angles + dérivées)
    │   ├── charts.js          # updateCharts (3 courbes)
    │   ├── hud.js             # FPS + temps
    │   └── analysis.js        # rules-as-functions, scoring, render
    ├── sources/
    │   ├── camera.js          # startCamera (getUserMedia)
    │   └── video.js           # load + scrub-aware loop
    └── io/
        └── export.js          # CSV / JSON
```

**Choix d'architecture** :

- **ES modules natifs** — pas de bundler, pas de build step.
- **Store mutable partagé** muté en place : référence stable, lectures O(1), pas de subscriptions à gérer.
- **`main.js` orchestrateur** : seul point qui combine `core/` + `ui/` + `sources/` + DOM events. Évite les dépendances circulaires.
- **Rules-as-functions** pour les diagnostics — ajouter un critère = ajouter une fonction au tableau `RULES` dans `src/ui/analysis.js`.
- **MediaPipe en UMD via CDN** (`window.Pose`, `window.Camera`) plutôt qu'en npm pour rester sans build.

---

## Stack

| Couche | Choix |
| --- | --- |
| Détection pose | [@mediapipe/pose](https://github.com/google/mediapipe) (33 landmarks, 3D) |
| Capture | `<video>` + `getUserMedia` / `requestVideoFrameCallback` |
| Rendu | Canvas 2D natif |
| Charts | Canvas 2D maison (pas de lib externe) |
| UI | HTML/CSS vanilla, Bebas Neue + Space Mono + Inter |
| Modules | ESM natifs, zéro dépendance npm |

---

## Données & confidentialité

- **Aucune donnée ne quitte le navigateur**. Pas de back-end, pas d'analytics, pas de télémétrie.
- Les exports CSV/JSON sont générés et téléchargés localement (`Blob` + `URL.createObjectURL`).
- Le fichier vidéo uploadé est lu via `URL.createObjectURL` — il reste en RAM côté client.
- Le seul appel réseau est le chargement initial des modèles MediaPipe depuis le CDN jsDelivr.

---

## Roadmap

- [ ] Détection de la phase d'appui (contact talon / médio / avant-pied) via landmarks pied
- [ ] Overlay de la ligne de force / centre de masse estimé
- [ ] Comparateur avant/après (deux runs côte à côte)
- [ ] Sélection du côté dominant (filmer le côté gauche vs droit)
- [ ] Mode "frame-par-frame" avec annotations
- [ ] Détection automatique de l'orientation (profil L vs R)
- [ ] Tests unitaires sur `core/math.js` et règles d'analyse

---

## Licence

À définir.

---

## Crédits

- Détection de pose : [Google MediaPipe](https://google.github.io/mediapipe/).
- Repères de cadence : Heiderscheit et al., *Effects of step rate manipulation on joint mechanics during running*, Med Sci Sports Exerc, 2011.
