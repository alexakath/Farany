# Spécification — Majoration Samedi / Dimanche sur "Générer Salaire Alea"

> **Statut : ✅ Implémenté et vérifié** (2026-07-09). Les 3 fichiers listés en section 8 sont modifiés conformément au plan ci-dessous. Testé en conditions réelles contre l'instance Dolibarr locale (section 9) — y compris le cas de chevauchement férié/weekend, cœur de la demande.

## 0. Page concernée (vérifié avec l'utilisateur)

Aucune page ne s'appelle littéralement "Salaires par mois" dans le projet. Après clarification, la page visée est **"Générer Salaire Alea"** :

- Route : `/gen-salaire-alea`, active dans le menu (`Navbar.jsx` ligne 12)
- Page : [`NewApp/src/pages/frontoffice/GenererSalaireAlea.jsx`](../NewApp/src/pages/frontoffice/GenererSalaireAlea.jsx)
- Popup de saisie : [`NewApp/src/components/GenererSalAleaPopup.jsx`](../NewApp/src/components/GenererSalAleaPopup.jsx)
- Calcul métier : `SalariesService.calculerSalaireAlea` dans [`NewApp/src/services/SalariesService.js:419-451`](../NewApp/src/services/SalariesService.js#L419-L451), qui s'appuie sur `getJourPasSalaire` (lignes 365-413)

C'est la seule page du projet qui génère un salaire mensuel **jour par jour** avec une majoration déjà existante (jours fériés) — exactement le terrain sur lequel greffer une seconde majoration (weekend).

## 1. Comportement actuel (avant modification)

1. L'utilisateur filtre des employés, ouvre la popup, saisit : `salaireJour` (montant/jour), `pourcentage` (majoration jour férié, %), `mois`, `annee`.
2. Pour chaque employé filtré, `calculerSalaireAlea` :
   - récupère `missingDates` = tous les jours du mois **non encore couverts** par une fiche de paie existante pour cet employé (`getJourPasSalaire`) — **aucune distinction jour de semaine / weekend aujourd'hui**, tous les jours manquants du mois sont comptés et payés, week-ends inclus.
   - compte combien de ces jours tombent un jour férié (`nbFeries`).
   - `total = joursNormaux × salaireJour + joursFériés × salaireJour × (1 + pourcentage/100)`.
3. Une fiche de paie est créée par employé, période = premier jour manquant → dernier jour manquant, montant = `total`.

## 2. Règle métier demandée

Ajouter à la popup :
- ☐ Case à cocher **Samedi**
- ☐ Case à cocher **Dimanche**
- Un champ **Majoration weekend (%)**, partagé entre les deux cases (un seul champ pour les deux, pas un champ par case — cohérent avec "1 champs de majoration" dans la demande)

Règles :
| Règle | Comportement |
|---|---|
| Case cochée | Le champ "Majoration weekend (%)" apparaît. Le samedi/dimanche correspondant est considéré comme **travaillé** → il est inclus dans les jours payés, majoré au taux weekend. |
| Case décochée | Le champ disparaît (s'il n'y a plus aucune case cochée). Le samedi/dimanche correspondant est considéré comme **non travaillé** → il n'est **pas payé** (exclu des jours générés), comme un jour de repos. |
| Samedi/dimanche qui tombe un jour férié, ET case cochée | Deux majorations s'appliquent potentiellement (férié et weekend) → on **ne cumule pas**, on applique la **plus grande des deux**. |

### ✅ Interprétation confirmée
L'employé n'étant pas payé les jours non travaillés, le samedi/dimanche décoché est **retiré du décompte de jours à payer** (le total baisse, la fiche ne couvre pas ce jour) — confirmé avec l'utilisateur. Utilisée dans tout le reste de ce document (section 4.2 : filtrage des jours, en plus de la majoration section 4.3).

## 3. UI à ajouter — `GenererSalAleaPopup.jsx`

### 3.1 State
```js
const [inputs, setInputs] = useState({
    salaireJour: "",
    pourcentage: "",
    mois: "",
    annee: "",
    travailleSamedi: false,      // nouveau
    travailleDimanche: false,    // nouveau
    pourcentageWeekend: "",      // nouveau
});
```

### 3.2 Champs (insérer après le champ "Mois"/"Année", ou juste après "Pourcentage majoration jour férié" — au choix visuel, sans impact fonctionnel)
```jsx
<div>
  <label>
    <input
      type="checkbox"
      checked={inputs.travailleSamedi}
      onChange={(e) => setInputs({ ...inputs, travailleSamedi: e.target.checked })}
    />
    {" "}Travaille le samedi
  </label>
</div>

<div>
  <label>
    <input
      type="checkbox"
      checked={inputs.travailleDimanche}
      onChange={(e) => setInputs({ ...inputs, travailleDimanche: e.target.checked })}
    />
    {" "}Travaille le dimanche
  </label>
</div>

{(inputs.travailleSamedi || inputs.travailleDimanche) && (
  <div>
    <label style={{ display: "block", marginBottom: "5px" }}>Majoration weekend (%) :</label>
    <input
      type="number"
      required
      style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
      value={inputs.pourcentageWeekend}
      onChange={(e) => setInputs({ ...inputs, pourcentageWeekend: e.target.value })}
    />
  </div>
)}
```

### 3.3 Réinitialisation du formulaire après soumission
`handleSubmit` doit remettre à zéro les 3 nouveaux champs, comme les autres :
```js
setInputs({
  salaireJour: "", pourcentage: "", mois: "", annee: "",
  travailleSamedi: false, travailleDimanche: false, pourcentageWeekend: "",
});
```

## 4. Calcul métier — `SalariesService.js`

### 4.1 Nouvelle signature de `calculerSalaireAlea`
Deux paramètres booléens + un paramètre numérique, ajoutés à la fin (compatible avec l'unique appelant existant) :
```js
calculerSalaireAlea: async (
  userId, mois, annee, salaireJour, pourcentageFerie,
  travailleSamedi = false, travailleDimanche = false, pourcentageWeekend = 0
) => {
  const missingDatesBrutes = await SalariesService.getJourPasSalaire(userId, mois, annee);

  // Reconstruction d'une Date locale à partir de la clé "YYYY-MM-DD" pour lire le
  // jour de la semaine — ne PAS passer la chaîne brute à `new Date(...)`, ambigu
  // selon les moteurs JS. Voir DOC_PAIEMENT_PAR_MOIS.md section 12 pour le même
  // écueil déjà rencontré côté import CSV.
  const dateDeKey = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // 4.2 — Exclusion des jours non travaillés (interprétation A, voir section 2)
  const missingDates = missingDatesBrutes.filter((key) => {
    const jour = dateDeKey(key).getDay(); // 0 = dimanche, 6 = samedi
    if (jour === 6 && !travailleSamedi) return false;
    if (jour === 0 && !travailleDimanche) return false;
    return true;
  });

  const nbTotal = missingDates.length;
  if (nbTotal === 0) {
    return { missingDates: [], nbTotal: 0, nbFeries: 0, nbWeekendMajores: 0, total: 0 };
  }

  const joursFeries = await JourFerieService.getAll();
  const feriesMoisJour = new Set(
    joursFeries.map((jf) => {
      const d = new Date(jf.dateDebut);
      return `${d.getMonth()}-${d.getDate()}`;
    })
  );

  // 4.3 — Montant jour par jour : la plus grande des majorations applicables ce jour-là
  const taux = Number(salaireJour);
  let total = 0;
  let nbFeries = 0;
  let nbWeekendMajores = 0;

  for (const key of missingDates) {
    const [, m, d] = key.split("-").map(Number);
    const jour = dateDeKey(key).getDay();

    const estFerie = feriesMoisJour.has(`${m - 1}-${d}`);
    const estWeekendMajore =
      (jour === 6 && travailleSamedi) || (jour === 0 && travailleDimanche);

    if (estFerie) nbFeries++;
    if (estWeekendMajore) nbWeekendMajores++;

    let majorationPct = 0;
    if (estFerie) majorationPct = Math.max(majorationPct, Number(pourcentageFerie));
    if (estWeekendMajore) majorationPct = Math.max(majorationPct, Number(pourcentageWeekend));

    total += taux * (1 + majorationPct / 100);
  }

  total = Math.round(total * 100) / 100;

  return { missingDates, nbTotal, nbFeries, nbWeekendMajores, total };
},
```

**Point d'attention** : `nbFeries` et `nbWeekendMajores` peuvent compter le **même jour** deux fois (un samedi férié coché compte dans les deux compteurs) — c'est voulu pour l'affichage ("X jours fériés, Y jours weekend majorés"), mais le montant, lui, n'applique jamais les deux majorations cumulées sur ce jour (section 4.3, `Math.max`).

### 4.2 Pas de changement dans `getJourPasSalaire`
Le filtrage weekend se fait **après** l'appel à `getJourPasSalaire` (dans `calculerSalaireAlea`), pas dedans — cette fonction est aussi appelée telle quelle par `ListeSalGenJour.jsx` (page différente, hors périmètre), donc on ne touche pas à sa signature ni son comportement.

## 5. Page — `GenererSalaireAlea.jsx`

### 5.1 Appel de `calculerSalaireAlea` (dans `handlePopupSubmit`, ligne ~99)
```js
const calcul = await SalariesService.calculerSalaireAlea(
  id,
  formData.mois,
  formData.annee,
  formData.salaireJour,
  formData.pourcentage,
  formData.travailleSamedi,
  formData.travailleDimanche,
  formData.pourcentageWeekend
);
```

### 5.2 Validation avant l'appel (ligne ~87)
Ajouter : si une case est cochée, `pourcentageWeekend` est obligatoire.
```js
const majorationWeekendRequise =
  (formData.travailleSamedi || formData.travailleDimanche) && !formData.pourcentageWeekend;

if (
  filteredIds.length === 0 || !formData.salaireJour || !formData.pourcentage ||
  !formData.mois || !formData.annee || majorationWeekendRequise
) {
  setError("Veuillez remplir tous les champs et filtrer au moins un salarié.");
  return;
}
```

### 5.3 Libellé de la fiche générée (ligne ~117)
Étendre le libellé existant pour mentionner aussi le weekend, par cohérence avec ce qu'il fait déjà pour les jours fériés :
```js
const label = `Période du ${dateDebut} au ${dateFin}` +
  (calcul.nbFeries > 0 ? ` (${calcul.nbFeries} jour(s) férié(s) majoré(s))` : "") +
  (calcul.nbWeekendMajores > 0 ? ` (${calcul.nbWeekendMajores} jour(s) weekend majoré(s))` : "");
```

## 6. Exemple de recette

Employé Technicien, aucune fiche existante en février 2024 (29 jours). `salaireJour = 20`, `pourcentage férié = 100`, jours fériés du mois : 14/02 (mercredi) et 22/02 (jeudi). Samedi coché avec `pourcentageWeekend = 50`, Dimanche décoché.

- Février 2024 : samedis = 3, 10, 17, 24 (4 jours) ; dimanches = 4, 11, 18, 25 (4 jours).
- Dimanche décoché → les 4 dimanches sont **retirés** du décompte → 29 − 4 = 25 jours restants.
- Sur ces 25 jours : 4 samedis (majorés weekend 50%, aucun n'est férié) + 2 jours fériés en semaine (14/02 mercredi, 22/02 jeudi, majorés férié 100%, aucun n'est samedi) + 19 jours normaux.
- Total = 19×20 + 4×20×1,5 + 2×20×2 = 380 + 120 + 80 = **580 €**.
- `nbFeries = 2`, `nbWeekendMajores = 4`, aucun chevauchement férié/weekend dans cet exemple (à tester séparément, voir section 7).

## 7. Checklist de tests avant mise en production

- [ ] Aucune case cochée → tous les samedis/dimanches du mois sont exclus du paiement (changement de comportement assumé par rapport à l'existant, où les weekends étaient payés au tarif normal par défaut — c'est le test le plus important à vérifier en premier).
- [ ] Samedi coché seul, Dimanche décoché → dimanches exclus du total et de la période générée, samedis inclus et majorés.
- [ ] Samedi + Dimanche cochés → les deux majorés au même `pourcentageWeekend`.
- [ ] Un samedi coché tombe un jour férié avec une majoration férié **plus grande** que la majoration weekend → la majoration férié est appliquée (pas de cumul, pas la weekend).
- [ ] Un dimanche coché tombe un jour férié avec une majoration weekend **plus grande** que la majoration férié → la majoration weekend est appliquée.
- [ ] Décocher une case après l'avoir cochée et saisi une majoration → le champ disparaît ; si l'autre case reste cochée, la majoration déjà saisie reste utilisable pour elle (un seul champ partagé, ne pas le vider en décochant une seule des deux cases).
- [ ] Case cochée mais champ "Majoration weekend" laissé vide → validation bloque avant tout appel API (section 5.2).
- [ ] Mois où tous les jours travaillés (semaine + weekends cochés) sont déjà couverts par des fiches existantes → `nbTotal = 0`, aucune fiche créée, comportement identique à l'existant.

## 8. Plan d'implémentation (ordre suggéré)

1. ✅ `SalariesService.js` — `calculerSalaireAlea` réécrit exactement comme en section 4 (nouvelle signature à 8 paramètres, filtrage des jours non travaillés, calcul jour par jour avec `Math.max` des majorations).
2. ✅ `GenererSalAleaPopup.jsx` — state + UI ajoutés comme en section 3 (2 checkboxes + champ conditionnel).
3. ✅ `GenererSalaireAlea.jsx` — appel étendu, validation étendue (majoration weekend obligatoire si une case est cochée), libellé étendu avec le décompte des jours weekend majorés.
4. ✅ Testé manuellement — voir section 9.

## 9. Vérification effectuée (2026-07-09)

- `npx eslint` sur les 3 fichiers modifiés : aucune erreur introduite (1 erreur préexistante et sans rapport sur un import inutilisé en tête de `SalariesService.js`, non touchée).
- `npm run build` : build de production OK.
- Deux tests en conditions réelles contre l'instance Dolibarr locale (fiches de test supprimées après vérification, aucune donnée laissée en base) :
  - **Rasoabe, Juin 2026 (aucune fiche existante, aucun jour férié ce mois-ci), salaire/jour = 25, Samedi coché (majoration 20%), Dimanche décoché** → fiche générée : **670,00 €**, période `01/06/2026 → 30/06/2026`, libellé `"(4 jour(s) weekend majoré(s))"`. Conforme au calcul théorique (22 jours ouvrés × 25 + 4 samedis × 25 × 1,20 = 670). Les 4 dimanches du mois sont bien absents de la période générée.
  - **Rasoabe, Février 2026 (28 jours : 4 samedis, 4 dimanches, dont le 14/02 = samedi férié et le 22/02 = dimanche férié), salaire/jour = 25, majoration férié = 90%, Samedi + Dimanche cochés, majoration weekend = 30%** → fiche générée : **790,00 €**, libellé `"(2 jour(s) férié(s) majoré(s)) (8 jour(s) weekend majoré(s))"`. Conforme au calcul théorique (20 jours ouvrés × 25 + 6 jours weekend non fériés × 25×1,30 + 2 jours weekend fériés × 25×1,90 = 500 + 195 + 95 = 790) — confirme que la majoration férié (90%, la plus grande) l'emporte bien sur la majoration weekend (30%) pour les 2 jours qui sont les deux à la fois, sans cumul des deux pourcentages.
- Aucune erreur console dans les deux tests.
