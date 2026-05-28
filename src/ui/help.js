// Contenu pédagogique par diagnostic : schéma ASCII + liste de pistes
// concrètes. Indexé par l'`id` retourné par chaque règle d'analyse.

export const HELP_CONTENT = {
  cadence: {
    schema: `
foulées rapides & courtes        foulées longues & lentes
   170–185 SPM  ✓                 <160 SPM  ✗ overstriding

      ↓ ↓ ↓ ↓ ↓ ↓                    ↓        ↓        ↓
       contact court            contact long (talon devant le bassin)
       impact réduit            impact frontal élevé
    `,
    tips: [
      "Métronome ou playlist 175–180 BPM, pieds calés sur le rythme.",
      "Augmente la cadence par paliers de +5 % max, sur 2–3 semaines.",
      "Garde la même vitesse au début : cadence ↑ = foulée raccourcie naturellement.",
      "Tu sentiras les mollets travailler plus les premiers jours — c'est normal.",
    ],
  },

  trunk: {
    schema: `
   trop vertical (<4°)      bon (5–10°)         cassé au bassin (>15°)

         │                      ╲                        ╱
         │                       ╲                     ╱
         │                        ╲                  ╱────
         │                         ╲              ╲╱
        / \\                        / \\             / \\
       /   \\                      /   \\           /   \\

   buste droit               inclinaison        flexion à la taille
   (freine la course)        depuis chevilles   (mauvais, dos sollicité)
    `,
    tips: [
      "Imagine que tu vas tomber en avant — l'angle vient des chevilles.",
      "Engage les abdos profonds, ouvre la poitrine, épaules basses.",
      "Regarde 15–20 m devant toi, pas tes pieds.",
      "Si tu te casses au bassin, c'est souvent un signal de fatigue ou de gainage faible.",
    ],
  },

  kneeSwing: {
    schema: `
   ENDURANCE (~95°)           SPRINT (~30°)            RAIDE (>130°)

      O hanche                  O hanche                  O hanche
      |\\                        |\\                        |
      | \\ genou                 | \\ genou                 |
      |  \\                      |  \\____ talon            O genou
      |   O                     |       fesse              |
      |    \\                                              |
      |     O cheville          ↑ retour ULTRA rapide      O cheville
                                ↑ coûte cher en ischios
      ↑ retour passif                                     ↑ jambe trop
      ↑ économie d'énergie                                  tendue, raide
    `,
    tips: [
      "Pensée motrice : « laisse pendre » plutôt que « ramène le talon ».",
      "Skipping bas (genoux ~90°), 2×30 m avant la séance — pas talons-fesses extrêmes.",
      "Renforce les fessiers (pont, hip thrust, fente arrière) : ça soulage les ischios.",
      "Si tu es en mode sprint sans le vouloir : baisse la cadence cible, tu fournis trop.",
    ],
  },

  kneeRom: {
    schema: `
  NORMAL ENDURANCE (~70°)    SPRINT (>100°)            RAIDE (<40°)

    175° ─┐                    178° ─┐                   150° ─┐
          │                          │                         │
          │ 70° ROM                  │ 145° ROM                │ 30° ROM
          │                          │                         │
     95° ─┘                     31° ─┘                   120° ─┘
     min                        min                      min

   extension max au toe-off      jambe quasi tendue ET    jambe peu mobile
   + repli modéré en swing       repli extrême            sur tout le cycle
    `,
    tips: [
      "ROM trop courte → travail technique : pousse plus longtemps au sol, étire les ischios.",
      "ROM trop large → tu cours probablement à allure de sprint, ou la cadence est trop basse.",
      "La mobilité hanche conditionne en grande partie le min : psoas raide = repli forcé.",
      "Si ROM cohérente avec une bonne cadence et un bon repli : tu es dans le sweet spot.",
    ],
  },

  hipRom: {
    schema: `
   HANCHE OUVERTE (30–55°)        HANCHE FERMÉE (<20°)

         ↗ jambe avant                ↗
        /                            /
       O hanche────                 O hanche────
            ↘                            ─
             ↘ jambe arrière              (jambe à peine derrière
              loin derrière               le bassin)

   moteur : grand fessier         moteur : quads + fléchisseurs
   (efficace, durable)            (fatiguant, peu propulsif)
    `,
    tips: [
      "Mobilité psoas : fentes profondes, posture du pigeon, 2×/sem.",
      "Renforce les fessiers : ils sont LE moteur de l'extension de hanche.",
      "Cherche à « pousser le sol vers l'arrière » plutôt que « tirer la jambe vers l'avant ».",
      "Position assise prolongée = psoas court. Pause debout toutes les heures.",
    ],
  },

  kneeAsym: {
    schema: `
   SYMÉTRIQUE (<5%)              ASYMÉTRIQUE (>10%)

     L           R                  L              R
     60°  ←→     61°                55°    ←—→    72°
      ●           ●                  ●              ●
      ↕           ↕                  ↕              ↕
      ●           ●                  ●              ●
      ROM proches                    écart significatif
                                     (genou L plus fléchi)
    `,
    tips: [
      "Travail unilatéral : split squats, fentes 2×8 répétitions par côté.",
      "Étire le côté plus tendu, renforce le côté plus faible.",
      "Vérifie un éventuel déficit de mobilité (cheville, hanche) côté dominant.",
      "Asymétrie persistante >10 % avec douleur : avis kiné / ostéo.",
    ],
  },

  hipAsym: {
    schema: `
   BASSIN STABLE                  BASSIN INCLINÉ
   (asym <5%)                     (asym >10%)

    ────────────                  ────╲
       hanches                    hanches ╲──
       au même niveau             une plus haute
                                  (Trendelenburg)

   fessier moyen actif            fessier moyen faible
   des deux côtés                 d'un côté
    `,
    tips: [
      "Renforce le moyen fessier : clamshell, planche latérale avec élévation, hip abduction.",
      "L'asymétrie de hanche pénalise tout le membre inférieur (genou, cheville).",
      "Vérifie l'inégalité de longueur de jambe si l'asymétrie est marquée et stable.",
      "Travail proprioceptif unilatéral : équilibre 1 minute par jambe, yeux fermés.",
    ],
  },
};
