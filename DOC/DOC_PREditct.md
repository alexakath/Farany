# 📊 Guide : Prédiction du coût de réouverture avec affichage en temps réel

# 📊 Résumé des créations pour l'amélioration des coûts

## 🎯 Vue d'ensemble

J'ai créé **4 modules d'amélioration** pour le système de gestion des coûts des tickets, avec un focus particulier sur la **prédiction des coûts de réouverture**.

---

## 📦 1. MODULE DE PRÉDICTION DES COÛTS DE RÉOUVERTURE

### ✨ Ce qui a été créé :

| Élément | Description |
|---------|-------------|
| **ModalAnnuler amélioré** | Affichage en temps réel du taux_open calculé |
| **Hook useCostPrediction** | Logique de calcul réutilisable |
| **Prédiction dynamique** | Calcul instantané lors de la saisie |
| **Visualisation interactive** | Barre de progression, indicateurs de viabilité |

### 📐 Formule de calcul :
```
taux_open = (last_cost × mode / 100) / itemsCount
```

### 🎨 Interface utilisateur :
- ✅ Affichage du taux estimé en direct
- ✅ Barre de progression du pourcentage
- ✅ Indicateur de viabilité (vert/orange/rouge)
- ✅ Détails du calcul transparents
- ✅ Alertes de dépassement

---

## 📊 2. TABLEAU DE BORD DES COÛTS (DASHBOARD)

### ✨ Ce qui a été créé :

| Élément | Description |
|---------|-------------|
| **KPI Cards** | Indicateurs clés : total, moyenne, répartition |
| **Graphiques interactifs** | Diagrammes circulaires et à barres |
| **Tableau détaillé** | Vue par ticket avec tous les types de coûts |
| **Filtres temporels** | Semaine, mois, année |
| **Mode vue** | Basculer entre graphique et tableau |

### 📊 Métriques affichées :
```
- Coût total général
- Coût saisi (closed)
- Coût d'ouverture (open)
- Coût GLPI (import)
- Nombre total de tickets
- Moyenne par ticket
- Répartition par type
- Évolution temporelle
```

---

## 📈 3. ANALYSE PRÉDICTIVE AVANCÉE

### ✨ Ce qui a été créé :

| Élément | Description |
|---------|-------------|
| **Service PredictionService** | Modèle de prédiction des coûts futurs |
| **Modèle de machine learning** | Moyenne mobile sur 7 jours |
| **Tendances par type d'item** | Analyse des coûts par catégorie d'asset |
| **Prédictions hebdomadaires** | Projection sur 4 semaines |
| **Indice de confiance** | Niveau de fiabilité des prédictions |

### 📊 Données analysées :
```
- Coût moyen par ticket
- Type d'item le plus coûteux
- Précision du modèle
- Prédictions hebdomadaires
- Tendance globale
- Croissance estimée
```

---

## 🔔 4. ALERTES ET NOTIFICATIONS

### ✨ Ce qui a été créé :

| Élément | Description |
|---------|-------------|
| **Service AlertService** | Détection automatique des anomalies |
| **Seuils configurables** | Max cost, augmentation, limites journalières |
| **Détection d'anomalies** | Coûts élevés, augmentations soudaines |
| **Alertes visuelles** | Affichage des alertes actives |
| **Gestion des alertes** | Résolution et historique |

### 🔔 Types d'alertes :
```
1. HIGH_COST        → Coût anormalement élevé
2. RAPID_INCREASE   → Augmentation soudaine
3. DAILY_OVERFLOW   → Limite journalière dépassée
4. WEEKLY_OVERFLOW  → Limite hebdomadaire dépassée
```

---

## 🛠️ STRUCTURE DES FICHIERS CRÉÉS

```
src/
├── components/
│   ├── ModalAnnuler.jsx           # ✨ AMÉLIORÉ avec prédiction
│   ├── CostPrediction.jsx         # 🆕 Composant de prédiction
│   └── CostAlerts.jsx             # 🆕 Composant d'alertes
│
├── pages/
│   └── backoffice/
│       └── DashCout.jsx           # ✨ AMÉLIORÉ avec graphiques
│
├── services/
│   └── backoffice/
│       ├── PredictionService.js   # 🆕 Service de prédiction
│       └── AlertService.js        # 🆕 Service d'alertes
│
├── hooks/
│   └── useCostPrediction.js       # 🆕 Hook de prédiction
│
└── utils/
    └── exportUtils.js             # 🆕 Export CSV/PDF
```

---

## 🔄 FLUX DE DONNÉES PRINCIPAL

### Pour la réouverture (ModalAnnuler) :

```
1. Utilisateur saisit Valeur + Mode
                ↓
2. useEffect déclenche le calcul
                ↓
3. Récupération : last_cost + itemsCount
                ↓
4. Calcul : taux_open = (last_cost × mode / 100) / itemsCount
                ↓
5. Affichage en direct :
   - Taux estimé
   - Barre de progression
   - Indicateur de viabilité
                ↓
6. Validation → Création du coût
```

### Pour le dashboard (DashCout) :

```
1. Appel API → Tous les coûts + tickets
                ↓
2. Groupement par ticket
                ↓
3. Calcul des totaux par type
                ↓
4. Rendu :
   - KPI Cards
   - Graphiques
   - Tableau détaillé
```

---

## 🎯 BÉNÉFICES APPORTÉS

| Avantage | Description |
|----------|-------------|
| **Transparence** | L'utilisateur voit le calcul avant validation |
| **Précision** | Évite les erreurs de saisie |
| **Visibilité** | Vue d'ensemble des coûts |
| **Proactivité** | Détection des anomalies |
| **Prédiction** | Anticipation des coûts futurs |
| **Reporting** | Export des données |

---

## 📈 EXEMPLE D'UTILISATION

### Scénario de réouverture :

```
Ticket #1234
├── Dernier coût: 1000 €
├── Items associés: 2
├── Mode: 50%
│
├── Calcul:
│   └── taux_open = (1000 × 50% / 100) / 2 = 250 €
│
├── Saisie utilisateur: 200 €
│
├── Résultat:
│   ├── ✅ Viable (200 € ≤ 250 €)
│   ├── Utilisation: 80%
│   └── Écart: -50 €
│
└── Validation → Création du coût
```

---

## 🚀 PROCHAINES AMÉLIORATIONS POSSIBLES

1. **Machine Learning avancé** : Modèles plus sophistiqués
2. **Intégration IA** : Prédiction par type d'item
3. **Dashboard en temps réel** : WebSockets
4. **Export automatique** : Rapports programmés
5. **Intégration email** : Notifications par email
6. **API REST** : Endpoints pour les prédictions
7. **Base de données** : Historique des prédictions
8. **Tests unitaires** : Couverture des calculs

---

**📌 Résumé :** J'ai créé un système complet de gestion et prédiction des coûts avec :
- ✅ Calcul en temps réel du taux_open
- ✅ Visualisation interactive
- ✅ Dashboard analytique
- ✅ Alertes automatiques
- ✅ Prédictions futures

Tous les composants sont **prêts à être intégrés** dans le projet existant ! 🎉

## 🎯 Objectif

Lorsqu'on saisit la **valeur** (montant) et le **mode** (pourcentage) dans `ModalAnnuler`, afficher dynamiquement le **taux_open** calculé avant validation.

---

## 🔧 1. Modification de ModalAnnuler.jsx

### Version améliorée avec prédiction en temps réel

```javascript
// src/components/ModalAnnuler.jsx
import { useState, useEffect, useMemo } from "react";
import CoutTicket from "../services/backoffice/CoutTicket";
import TicketService from "../services/backoffice/TicketService";

function ModalAnnuler({ id_ticket, onClose, onSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [reouverture, setReouverture] = useState("");
  const [mode, setMode] = useState("");
  
  // États pour la prédiction
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [lastCost, setLastCost] = useState(null);
  const [itemsCount, setItemsCount] = useState(null);

  // Récupération du dernier coût et du nombre d'items au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupère le dernier coût
        const last = await CoutTicket.getLastCout(id_ticket);
        setLastCost(last || 0);
        
        // 2. Récupère les items du ticket
        const items = await TicketService.getItemByTicketId(id_ticket);
        setItemsCount(items.length || 1);
        
      } catch (err) {
        console.error("Erreur récupération données:", err);
      }
    };
    fetchData();
  }, [id_ticket]);

  // Calcul de la prédiction en temps réel
  useEffect(() => {
    if (!showInput) {
      setPrediction(null);
      return;
    }

    const calculatePrediction = () => {
      const valeur = parseFloat(reouverture);
      const modeValue = parseFloat(mode);
      
      // Vérification des valeurs
      if (isNaN(valeur) || isNaN(modeValue) || !lastCost || !itemsCount) {
        setPrediction(null);
        return;
      }

      // Validation du mode (doit être entre 0 et 100)
      if (modeValue < 0 || modeValue > 100) {
        setPrediction({ 
          error: "Le mode doit être entre 0 et 100",
          taux: null 
        });
        return;
      }

      // Calcul : taux_open = (last_cost * mode / 100) / itemsCount
      const taux_open = (lastCost * modeValue / 100) / itemsCount;
      
      // Pourcentage du coût total
      const pourcentage = (taux_open / lastCost * 100);
      
      setPrediction({
        taux: taux_open,
        pourcentage: pourcentage,
        lastCost: lastCost,
        itemsCount: itemsCount,
        valeur: valeur,
        mode: modeValue,
        isViable: valeur <= taux_open // Vérifie si la valeur saisie est viable
      });
    };

    // Debounce pour éviter les calculs trop fréquents
    const timer = setTimeout(calculatePrediction, 300);
    return () => clearTimeout(timer);
  }, [reouverture, mode, lastCost, itemsCount, showInput]);

  // Réinitialisation des champs
  const resetFields = () => {
    setReouverture("");
    setMode("");
    setPrediction(null);
  };

  // Annulation simple
  const handleAnnuler = async () => {
    setError("");
    setLoading(true);
    try {
      const success = await CoutTicket.deleteLast(id_ticket);
      if (success) {
        await TicketService.updateStatus(id_ticket, 2);
        onSuccess();
      } else {
        setError("Erreur lors de l'annulation.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur serveur lors de l'annulation.");
    } finally {
      setLoading(false);
    }
  };

  // Réouverture
  const handleReouverture = async () => {
    setError("");
    setLoading(true);
    try {
      const modeNumerique = parseInt(mode, 10);
      await CoutTicket.CreateOK(id_ticket, reouverture, modeNumerique);
      await TicketService.updateStatus(id_ticket, 2);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Formatage des nombres
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    return Number(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Annulation / Réouverture</h2>
          <button onClick={onClose} disabled={loading} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.content}>
          {/* Bouton bascule Réouverture */}
          <button
            onClick={() => {
              setShowInput(!showInput);
              if (!showInput) resetFields();
            }}
            style={styles.toggleBtn}
            disabled={loading}
          >
            {showInput ? "Masquer Réouverture" : "🔓 Réouverture"}
          </button>

          {/* Formulaire de réouverture avec prédiction */}
          {showInput && (
            <div style={styles.reouvertureContainer}>
              {/* Champs de saisie */}
              <div style={styles.inputGroup}>
                <div style={styles.field}>
                  <label style={styles.label}>Valeur (montant)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={reouverture}
                    onChange={(e) => setReouverture(e.target.value)}
                    placeholder="Ex: 150.50"
                    disabled={loading}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Mode (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    placeholder="Ex: 50"
                    disabled={loading}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Zone de prédiction */}
              {prediction && (
                <div style={styles.predictionContainer}>
                  <div style={styles.predictionHeader}>
                    <span>📊 Taux_open estimé</span>
                    {prediction.error ? (
                      <span style={styles.predictionError}>{prediction.error}</span>
                    ) : (
                      <span style={styles.predictionValue}>
                        {formatNumber(prediction.taux)} €
                      </span>
                    )}
                  </div>

                  {!prediction.error && (
                    <div style={styles.predictionDetails}>
                      {/* Barre de progression */}
                      <div style={styles.progressBarContainer}>
                        <div style={styles.progressBarLabel}>
                          <span>Progression</span>
                          <span>{prediction.pourcentage.toFixed(1)}%</span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${Math.min(prediction.pourcentage, 100)}%`,
                              backgroundColor: prediction.isViable 
                                ? prediction.pourcentage > 80 ? '#f44336' 
                                : prediction.pourcentage > 50 ? '#ff9800' 
                                : '#4caf50'
                                : '#f44336'
                            }}
                          />
                        </div>
                      </div>

                      {/* Détails du calcul */}
                      <div style={styles.calculationDetails}>
                        <div style={styles.detailRow}>
                          <span>Dernier coût</span>
                          <span>{formatNumber(prediction.lastCost)} €</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Mode appliqué</span>
                          <span>{prediction.mode}%</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Nombre d'items</span>
                          <span>{prediction.itemsCount}</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Valeur saisie</span>
                          <span style={{
                            color: prediction.isViable ? '#4caf50' : '#f44336',
                            fontWeight: 'bold'
                          }}>
                            {formatNumber(prediction.valeur)} €
                            {prediction.isViable ? ' ✅' : ' ⚠️'}
                          </span>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Écart</span>
                          <span style={{
                            color: prediction.isViable ? '#4caf50' : '#f44336'
                          }}>
                            {prediction.isViable 
                              ? `${((prediction.valeur / prediction.taux) * 100).toFixed(1)}% du taux`
                              : `Dépassement de ${(prediction.valeur / prediction.taux * 100 - 100).toFixed(1)}%`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Alerte si dépassement */}
                      {!prediction.isViable && (
                        <div style={styles.warningAlert}>
                          ⚠️ La valeur saisie ({formatNumber(prediction.valeur)} €) dépasse 
                          le taux estimé ({formatNumber(prediction.taux)} €) !
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bouton de validation */}
              <button
                onClick={handleReouverture}
                disabled={loading || !reouverture || !mode}
                style={{
                  ...styles.submitBtn,
                  opacity: (loading || !reouverture || !mode) ? 0.6 : 1
                }}
              >
                {loading ? "Traitement..." : "✅ Valider la réouverture"}
              </button>
            </div>
          )}

          {/* Bouton Annulation simple */}
          {!showInput && (
            <button
              onClick={handleAnnuler}
              disabled={loading}
              style={{
                ...styles.cancelBtn,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Traitement..." : "❌ Annuler le ticket"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: 16,
    padding: "1.5rem 2rem",
    width: 480,
    maxWidth: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "0.75rem",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#999",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  error: {
    color: "#f44336",
    marginBottom: "1rem",
    padding: "8px 12px",
    background: "#ffebee",
    borderRadius: "6px",
    fontSize: "14px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  toggleBtn: {
    padding: "10px",
    border: "2px dashed #2563eb",
    borderRadius: "8px",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  reouvertureContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    border: "1px solid #e0e0e0",
    padding: "16px",
    borderRadius: "8px",
    background: "#fafafa",
  },
  inputGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "border-color 0.2s",
    outline: "none",
  },
  predictionContainer: {
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  predictionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  predictionValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a237e",
  },
  predictionError: {
    color: "#f44336",
    fontSize: "13px",
  },
  predictionDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  progressBarContainer: {
    marginBottom: "4px",
  },
  progressBarLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#666",
    marginBottom: "4px",
  },
  progressBar: {
    height: "8px",
    background: "#f0f0f0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  calculationDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 12px",
    fontSize: "13px",
    marginTop: "4px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
    color: "#555",
  },
  warningAlert: {
    background: "#fff3e0",
    border: "1px solid #ff9800",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#e65100",
    marginTop: "4px",
  },
  submitBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  cancelBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
};

export default ModalAnnuler;
```

---

## 🔧 2. Modification du service CoutTicket

### Ajout de la méthode `CreateOK`

```javascript
// src/services/backoffice/CoutTicket.js (extrait)

const CoutTicket = {
    // ... autres méthodes ...

    // Nouvelle méthode CreateOK avec mode
    CreateOK: async (id_ticket, open, mode) => {
        try {
            // 1. Récupère les items du ticket
            const items = await TicketService.getItemByTicketId(id_ticket);
            if (!items.length) throw new Error("Aucun item trouvé pour ce ticket");
            
            const nbdivise = items.length;
            
            // 2. Récupère le dernier coût
            const last_cout = await CoutTicket.getLastCout(id_ticket);
            console.log("last_cout:", last_cout, "open:", open, "mode:", mode);
            
            // 3. Calcul du taux_open avec le mode (pourcentage)
            // taux_open = (last_cout * mode / 100) / nbdivise
            const taux_open = (last_cout * mode / 100) / nbdivise;
            
            // 4. Création des coûts pour chaque item
            const date = new Date().toISOString().slice(0, 19);
            await Promise.all(
                items.map(item => 
                    CoutTicket.create(
                        id_ticket,
                        "open",
                        Number(taux_open),
                        item.items_id,
                        item.itemtype,
                        date
                    )
                )
            );
            
            return { success: true, taux_open, itemsCount: nbdivise };
            
        } catch (err) {
            console.error("Erreur CreateOK:", err);
            throw new Error("Erreur lors de la création du coût de réouverture");
        }
    },

    // getLastCout (déjà existante)
    getLastCout: async (idTicket) => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/cout-ticket/ticket/${idTicket}/last-cost`);
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du dernier coût");
        }
        return response.json();
    },
};

export default CoutTicket;
```

---

## 🔧 3. Optimisation avec Hook personnalisé

### Création du hook `useCostPrediction`

```javascript
// src/hooks/useCostPrediction.js
import { useState, useEffect, useCallback } from 'react';
import CoutTicket from '../services/backoffice/CoutTicket';
import TicketService from '../services/backoffice/TicketService';

export function useCostPrediction(ticketId) {
    const [lastCost, setLastCost] = useState(null);
    const [itemsCount, setItemsCount] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Chargement des données initiales
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [last, items] = await Promise.all([
                    CoutTicket.getLastCout(ticketId),
                    TicketService.getItemByTicketId(ticketId)
                ]);
                setLastCost(last || 0);
                setItemsCount(items?.length || 1);
                setError(null);
            } catch (err) {
                console.error("Erreur chargement:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (ticketId) {
            loadData();
        }
    }, [ticketId]);

    // Calcul de la prédiction
    const calculatePrediction = useCallback((valeur, mode) => {
        if (!lastCost || !itemsCount) {
            setPrediction(null);
            return;
        }

        const valeurNum = parseFloat(valeur);
        const modeNum = parseFloat(mode);

        if (isNaN(valeurNum) || isNaN(modeNum)) {
            setPrediction(null);
            return;
        }

        // Validation
        if (modeNum < 0 || modeNum > 100) {
            setPrediction({
                error: "Le mode doit être entre 0 et 100",
                taux: null
            });
            return;
        }

        // Calcul
        const taux_open = (lastCost * modeNum / 100) / itemsCount;
        const pourcentage = (taux_open / lastCost * 100);

        setPrediction({
            taux: taux_open,
            pourcentage: pourcentage,
            lastCost: lastCost,
            itemsCount: itemsCount,
            valeur: valeurNum,
            mode: modeNum,
            isViable: valeurNum <= taux_open,
            difference: valeurNum - taux_open,
            differencePercentage: ((valeurNum / taux_open) * 100 - 100)
        });

        return prediction;
    }, [lastCost, itemsCount]);

    return {
        lastCost,
        itemsCount,
        prediction,
        loading,
        error,
        calculatePrediction,
        hasData: lastCost !== null && itemsCount !== null
    };
}

export default useCostPrediction;
```

### Utilisation du hook

```javascript
// Dans ModalAnnuler.jsx
import useCostPrediction from '../hooks/useCostPrediction';

function ModalAnnuler({ id_ticket, onClose, onSuccess }) {
    const { 
        lastCost, 
        itemsCount, 
        prediction, 
        loading: dataLoading,
        calculatePrediction 
    } = useCostPrediction(id_ticket);

    // Utiliser calculatePrediction dans le useEffect
    useEffect(() => {
        if (showInput && reouverture && mode) {
            calculatePrediction(reouverture, mode);
        }
    }, [reouverture, mode, showInput, calculatePrediction]);

    // ... reste du composant
}
```

---

## 📊 4. Interface utilisateur améliorée

### Styles CSS supplémentaires

```css
/* src/assets/components/modal-annuler.css */

/* Animation de la barre de progression */
@keyframes pulse {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(1.02); }
}

.progress-fill {
    animation: pulse 2s ease-in-out infinite;
}

/* Badge de statut */
.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-ok {
    background: #e8f5e9;
    color: #2e7d32;
}

.status-warning {
    background: #fff3e0;
    color: #e65100;
}

.status-danger {
    background: #ffebee;
    color: #c62828;
}

/* Tooltip personnalisé */
.tooltip {
    position: relative;
    cursor: help;
}

.tooltip:hover::after {
    content: attr(data-tip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
}
```

---

## ✅ Résumé des fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Prédiction en temps réel** | Calcul dynamique du taux_open lors de la saisie |
| **Barre de progression** | Visualisation du pourcentage d'utilisation |
| **Validation de viabilité** | Indique si la valeur saisie est cohérente |
| **Détails du calcul** | Affichage transparent de la formule |
| **Alertes de dépassement** | Notification si la valeur dépasse le taux |
| **Formatage des nombres** | Affichage propre des montants |

---

## 📈 Exemple de calcul

```
Données:
- Dernier coût: 1000 €
- Nombre d'items: 2
- Mode: 50%
- Valeur saisie: 200 €

Calcul:
taux_open = (1000 × 50 / 100) / 2 = 250 €

Résultat:
- Taux estimé: 250 €
- Valeur saisie: 200 € ✅ (viable)
- Écart: -50 € (20% en dessous)
```

Le modal affichera donc que la réouverture est viable et montrera les détails du calcul.



