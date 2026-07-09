##### RESET 

### Etape 
 # 1- Importer les api (url,token,etc)
 ex: const API_BASE  = import.meta.env.VITE_GLPI_URL;
const API_TOKEN = import.meta.env.VITE_GLPI_TOKEN;

# 2- Creer la configuration : 
ex: 
  tickets: {
    group: "Assistance", label: "Tickets", endpoint: "Assistance/Ticket",
    order: 1, dependencies: [],
    description: "Ticket 1 (Tsy mandeha) et Ticket 2 (Michauffe). Purge auto: suivis, coûts, membres et liaisons documents.",
         },



# SERVICE
import axios from "axios";

const BASE_URL = process.env.REACT_APP_DOLIBARR_URL || "http://localhost/api/index.php";
const API_KEY  = process.env.REACT_APP_DOLIBARR_API_KEY || "";

const headers = {
  "DOLAPIKEY": API_KEY,
  "Content-Type": "application/json",
};

// ─── Helpers bas niveau ───────────────────────────────────────────────────────

/**
 * Récupère tous les IDs d'une ressource Dolibarr.
 * @param {string} endpoint  ex: "Assistance/Ticket"
 * @param {number} limit     nombre max d'entrées par page
 */
async function fetchAllIds(endpoint, limit = 500) {
  try {
    const res = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers,
      params: { limit, sqlfilters: "" },
    });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((item) => item.id).filter(Boolean);
  } catch (err) {
    console.error(`[resetService] fetchAllIds(${endpoint}) →`, err.message);
    return [];
  }
}

/**
 * Supprime une ressource par son ID.
 * @param {string} endpoint
 * @param {string|number} id
 */
async function deleteById(endpoint, id) {
  try {
    await axios.delete(`${BASE_URL}/${endpoint}/${id}`, { headers });
    return { success: true, id };
  } catch (err) {
    console.error(`[resetService] deleteById(${endpoint}/${id}) →`, err.message);
    return { success: false, id, error: err.message };
  }
}

/**
 * Purge complète d'une ressource : fetch tous les IDs puis delete un par un.
 * Retourne un rapport { total, deleted, failed }.
 */
async function purgeEndpoint(endpoint, limit = 500) {
  const ids = await fetchAllIds(endpoint, limit);
  if (!ids.length) return { total: 0, deleted: 0, failed: 0 };

  const results = await Promise.all(ids.map((id) => deleteById(endpoint, id)));
  const deleted = results.filter((r) => r.success).length;
  const failed  = results.filter((r) => !r.success).length;

  return { total: ids.length, deleted, failed };
}

// ─── Fonctions métier par entité ──────────────────────────────────────────────

export async function resetTickets() {
  // Purge des éléments liés avant les tickets eux-mêmes
  await purgeEndpoint("Assistance/TicketMessage");      // suivis / messages
  await purgeEndpoint("Assistance/TicketDocument");     // liaisons documents

  const report = await purgeEndpoint("Assistance/Ticket");
  return { entity: "tickets", ...report };
}

export async function resetFactures() {
  await purgeEndpoint("Payments");                      // paiements liés
  await purgeEndpoint("Billings/InvoiceLines");         // lignes
  const report = await purgeEndpoint("Billings/Invoice");
  return { entity: "factures", ...report };
}

export async function resetDevis() {
  await purgeEndpoint("Commercial/Propal/Lines");
  const report = await purgeEndpoint("Commercial/Propal");
  return { entity: "devis", ...report };
}

export async function resetCommandes() {
  await purgeEndpoint("Orders/OrderLines");
  const report = await purgeEndpoint("Orders");
  return { entity: "commandes", ...report };
}

export async function resetCommandesFournisseurs() {
  await purgeEndpoint("SupplierOrders/Lines");
  const report = await purgeEndpoint("SupplierOrders");
  return { entity: "commandesFournisseurs", ...report };
}

export async function resetFacturesFournisseurs() {
  await purgeEndpoint("SupplierInvoices/Lines");
  const report = await purgeEndpoint("SupplierInvoices");
  return { entity: "facturesFournisseurs", ...report };
}

export async function resetContacts() {
  const report = await purgeEndpoint("Contacts");
  return { entity: "contacts", ...report };
}

export async function resetSocietes() {
  const report = await purgeEndpoint("Thirdparties");
  return { entity: "societes", ...report };
}

export async function resetProduits() {
  const report = await purgeEndpoint("Products");
  return { entity: "produits", ...report };
}

export async function resetStocks() {
  await purgeEndpoint("Warehouses/StockMovements");
  const report = await purgeEndpoint("Warehouses");
  return { entity: "stocks", ...report };
}

export async function resetProjets() {
  await purgeEndpoint("Projects/Tasks/Records");
  await purgeEndpoint("Projects/Tasks");
  const report = await purgeEndpoint("Projects");
  return { entity: "projets", ...report };
}

export async function resetAgenda() {
  const report = await purgeEndpoint("ActionComm");
  return { entity: "agenda", ...report };
}

// ─── Orchestrateur global ─────────────────────────────────────────────────────

/**
 * Lance le reset de plusieurs entités dans l'ordre des dépendances.
 * @param {string[]} keys  Clés du RESET_MODEL à traiter
 * @param {Function} onProgress  Callback (key, rapport) appelé après chaque entité
 */
export async function runReset(keys, onProgress) {
  const handlers = {
    tickets:               resetTickets,
    factures:              resetFactures,
    devis:                 resetDevis,
    commandes:             resetCommandes,
    commandesFournisseurs: resetCommandesFournisseurs,
    facturesFournisseurs:  resetFacturesFournisseurs,
    contacts:              resetContacts,
    societes:              resetSocietes,
    produits:              resetProduits,
    stocks:                resetStocks,
    projets:               resetProjets,
    agenda:                resetAgenda,
  };

  const rapports = [];

  for (const key of keys) {
    const fn = handlers[key];
    if (!fn) {
      console.warn(`[resetService] Aucun handler pour la clé "${key}"`);
      continue;
    }
    const rapport = await fn();
    rapports.push(rapport);
    if (typeof onProgress === "function") onProgress(key, rapport);
  }

  return rapports;
}




# Model 
/**
 * RESET_MODEL
 * ──────────────────────────────────────────────────────────────────────────────
 * Dictionnaire de toutes les entités Dolibarr réinitialisables.
 *
 * Chaque entrée expose :
 *   group        → catégorie d'affichage dans la page Reset
 *   label        → libellé humain
 *   endpoint     → chemin API Dolibarr (relatif à /api/index.php/)
 *   order        → ordre d'exécution (les dépendances ont un order plus petit)
 *   dependencies → clés des entités à purger AVANT celle-ci
 *   description  → résumé des sous-éléments purgés automatiquement
 */

export const RESET_MODEL = {

  // ── Assistance ──────────────────────────────────────────────────────────────
  tickets: {
    group: "Assistance",
    label: "Tickets",
    endpoint: "Assistance/Ticket",
    order: 1,
    dependencies: [],
    description:
      "Ticket 1 (Tsy mandeha) et Ticket 2 (Michauffe). " +
      "Purge auto : suivis, coûts, membres et liaisons documents.",
  },

  // ── Commercial ──────────────────────────────────────────────────────────────
  devis: {
    group: "Commercial",
    label: "Devis / Propositions",
    endpoint: "Commercial/Propal",
    order: 2,
    dependencies: [],
    description:
      "Toutes les propositions commerciales (brouillon, validé, signé). " +
      "Purge auto : lignes de devis et documents associés.",
  },

  commandes: {
    group: "Commercial",
    label: "Commandes clients",
    endpoint: "Orders",
    order: 3,
    dependencies: ["devis"],
    description:
      "Commandes clients dans tous les statuts. " +
      "Purge auto : lignes de commande, expéditions et liaisons.",
  },

  // ── Facturation ─────────────────────────────────────────────────────────────
  factures: {
    group: "Facturation",
    label: "Factures clients",
    endpoint: "Billings/Invoice",
    order: 4,
    dependencies: ["commandes"],
    description:
      "Factures brouillon, validées et payées. " +
      "Purge auto : lignes, paiements, remises et avoirs.",
  },

  // ── Fournisseurs ────────────────────────────────────────────────────────────
  commandesFournisseurs: {
    group: "Fournisseurs",
    label: "Commandes fournisseurs",
    endpoint: "SupplierOrders",
    order: 5,
    dependencies: [],
    description:
      "Toutes les commandes d'achat fournisseurs. " +
      "Purge auto : lignes, réceptions et documents liés.",
  },

  facturesFournisseurs: {
    group: "Fournisseurs",
    label: "Factures fournisseurs",
    endpoint: "SupplierInvoices",
    order: 6,
    dependencies: ["commandesFournisseurs"],
    description:
      "Factures d'achat (brouillon, validée, payée). " +
      "Purge auto : lignes, paiements et avoirs fournisseurs.",
  },

  // ── Annuaire ────────────────────────────────────────────────────────────────
  contacts: {
    group: "Annuaire",
    label: "Contacts",
    endpoint: "Contacts",
    order: 7,
    dependencies: [],
    description:
      "Tous les contacts individuels. " +
      "Purge auto : catégories contacts et liaisons tiers.",
  },

  societes: {
    group: "Annuaire",
    label: "Tiers / Sociétés",
    endpoint: "Thirdparties",
    order: 8,
    dependencies: ["contacts", "factures", "commandes", "devis"],
    description:
      "Clients, fournisseurs et prospects. " +
      "Purge auto : contacts, adresses, catégories et notes.",
  },

  // ── Catalogue ───────────────────────────────────────────────────────────────
  produits: {
    group: "Catalogue",
    label: "Produits & Services",
    endpoint: "Products",
    order: 9,
    dependencies: [],
    description:
      "Produits physiques et services. " +
      "Purge auto : prix par tiers, déclinaisons et photos.",
  },

  stocks: {
    group: "Catalogue",
    label: "Stocks & Entrepôts",
    endpoint: "Warehouses",
    order: 10,
    dependencies: ["produits"],
    description:
      "Entrepôts et niveaux de stock. " +
      "Purge auto : mouvements de stock, inventaires et transferts.",
  },

  // ── Projets ─────────────────────────────────────────────────────────────────
  projets: {
    group: "Projets",
    label: "Projets & Tâches",
    endpoint: "Projects",
    order: 11,
    dependencies: [],
    description:
      "Tous les projets et leurs tâches. " +
      "Purge auto : tâches, suivis de temps, membres et documents.",
  },

  // ── Agenda ──────────────────────────────────────────────────────────────────
  agenda: {
    group: "Agenda",
    label: "Événements agenda",
    endpoint: "ActionComm",
    order: 12,
    dependencies: [],
    description:
      "Appels, RDV, emails et actions commerciales. " +
      "Purge auto : contacts liés et documents joints.",
  },
};

// ─── Helpers dérivés ──────────────────────────────────────────────────────────

/** Retourne les clés triées par order d'exécution */
export function getSortedKeys() {
  return Object.keys(RESET_MODEL).sort(
    (a, b) => RESET_MODEL[a].order - RESET_MODEL[b].order
  );
}

/** Groupe les clés par leur propriété `group` */
export function getGroupedEntities() {
  return Object.entries(RESET_MODEL).reduce((acc, [key, entity]) => {
    if (!acc[entity.group]) acc[entity.group] = [];
    acc[entity.group].push({ key, ...entity });
    return acc;
  }, {});
}

/** Résout l'ordre complet d'exécution en tenant compte des dépendances */
export function resolveExecutionOrder(selectedKeys) {
  const all = new Set();

  function collect(key) {
    if (all.has(key)) return;
    const entity = RESET_MODEL[key];
    if (!entity) return;
    entity.dependencies.forEach(collect);
    all.add(key);
  }

  selectedKeys.forEach(collect);

  return [...all].sort(
    (a, b) => RESET_MODEL[a].order - RESET_MODEL[b].order
  );
}



# Page
import React, { useState, useMemo, useCallback } from "react";
import { RESET_MODEL, getGroupedEntities, resolveExecutionOrder } from "../models/resetModel";
import { runReset } from "../services/resetService";

// ─── Constantes de style ───────────────────────────────────────────────────────

const COLOR = {
  danger:  { bg: "#FCEBEB", border: "#F09595", text: "#A32D2D", badge: "#E24B4A" },
  warning: { bg: "#FAEEDA", border: "#FAC775", text: "#854F0B", badge: "#BA7517" },
  success: { bg: "#EAF3DE", border: "#97C459", text: "#3B6D11", badge: "#639922" },
  neutral: { bg: "#F1EFE8", border: "#B4B2A9", text: "#5F5E5A", badge: "#888780" },
};

const STATUS = {
  idle:    "idle",
  confirm: "confirm",
  running: "running",
  done:    "done",
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function GroupLabel({ name }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#888780",
      margin: "24px 0 8px",
    }}>
      {name}
    </p>
  );
}

function EntityCard({ entityKey, entity, selected, onChange, progress }) {
  const isRunning  = progress?.status === "running";
  const isDone     = progress?.status === "done";
  const hasFailed  = isDone && progress.failed > 0;
  const isSelected = selected;

  const borderColor = hasFailed
    ? COLOR.danger.border
    : isDone
    ? COLOR.success.border
    : isSelected
    ? "#378ADD"
    : "#D3D1C7";

  const bgColor = hasFailed
    ? COLOR.danger.bg
    : isDone
    ? COLOR.success.bg
    : isSelected
    ? "#E6F1FB"
    : "#fff";

  return (
    <div
      onClick={() => !progress && onChange(entityKey)}
      style={{
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        padding: "12px 14px",
        background: bgColor,
        cursor: progress ? "default" : "pointer",
        transition: "border-color 0.15s, background 0.15s",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Checkbox */}
      {!progress && (
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <div style={{
            width: 18, height: 18,
            border: `2px solid ${isSelected ? "#378ADD" : "#B4B2A9"}`,
            borderRadius: 4,
            background: isSelected ? "#378ADD" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Statut progression */}
      {progress && (
        <div style={{ position: "absolute", top: 10, right: 12 }}>
          {isRunning && <Spinner />}
          {isDone && !hasFailed && <CheckIcon color={COLOR.success.badge} />}
          {isDone && hasFailed  && <WarnIcon  color={COLOR.danger.badge}  />}
        </div>
      )}

      <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 3px", color: "#2C2C2A", paddingRight: 28 }}>
        {entity.label}
      </p>
      <p style={{ fontSize: 12, color: "#5F5E5A", margin: "0 0 8px", lineHeight: 1.5, paddingRight: 28 }}>
        {entity.description}
      </p>

      {/* Endpoint badge */}
      <span style={{
        fontSize: 11,
        background: "#F1EFE8",
        color: "#5F5E5A",
        borderRadius: 4,
        padding: "2px 7px",
        fontFamily: "monospace",
      }}>
        {entity.endpoint}
      </span>

      {/* Rapport post-exécution */}
      {isDone && (
        <div style={{
          marginTop: 8,
          fontSize: 12,
          color: hasFailed ? COLOR.danger.text : COLOR.success.text,
        }}>
          ✓ {progress.deleted} supprimé(s)
          {progress.failed > 0 && ` · ✗ ${progress.failed} erreur(s)`}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: "2px solid #D3D1C7",
      borderTopColor: "#378ADD",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8.5" fill={color} />
      <path d="M5 9l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WarnIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8.5" fill={color} />
      <path d="M9 5v5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="13" r="1" fill="#fff"/>
    </svg>
  );
}

function ConfirmModal({ selectedKeys, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  const PHRASE = "RESET";
  const valid  = typed.trim().toUpperCase() === PHRASE;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 14,
        padding: "28px 32px",
        maxWidth: 480, width: "90%",
        boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: 44, height: 44,
          background: COLOR.danger.bg,
          border: `1.5px solid ${COLOR.danger.border}`,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 16,
        }}>⚠️</div>

        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: COLOR.danger.text }}>
          Confirmer le reset
        </h2>
        <p style={{ fontSize: 14, color: "#5F5E5A", margin: "0 0 12px", lineHeight: 1.6 }}>
          Cette opération va supprimer définitivement les données de{" "}
          <strong style={{ color: "#2C2C2A" }}>{selectedKeys.length} entité(s)</strong>.
          Cette action est <strong>irréversible</strong>.
        </p>

        <ul style={{ fontSize: 13, color: "#444441", paddingLeft: 18, margin: "0 0 20px" }}>
          {selectedKeys.map((k) => (
            <li key={k}>{RESET_MODEL[k]?.label}</li>
          ))}
        </ul>

        <label style={{ fontSize: 13, color: "#5F5E5A", display: "block", marginBottom: 6 }}>
          Tapez <strong style={{ color: COLOR.danger.text }}>RESET</strong> pour confirmer :
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="RESET"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: `1.5px solid ${valid ? COLOR.success.border : "#D3D1C7"}`,
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 20,
            boxSizing: "border-box",
            outline: "none",
            fontFamily: "monospace",
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px",
              border: "1.5px solid #D3D1C7",
              borderRadius: 8,
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              color: "#444441",
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!valid}
            style={{
              padding: "8px 20px",
              border: "none",
              borderRadius: 8,
              background: valid ? COLOR.danger.badge : "#F0F0F0",
              color: valid ? "#fff" : "#B4B2A9",
              cursor: valid ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 500,
              transition: "background 0.15s",
            }}
          >
            Lancer le reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ResetPage() {
  const [selected, setSelected]   = useState(new Set());
  const [status,   setStatus]     = useState(STATUS.idle);
  const [progress, setProgress]   = useState({});  // { [key]: { status, deleted, failed } }
  const [rapports, setRapports]   = useState([]);

  const grouped = useMemo(() => getGroupedEntities(), []);

  const toggleEntity = useCallback((key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleAll = () => {
    const allKeys = Object.keys(RESET_MODEL);
    setSelected(selected.size === allKeys.length ? new Set() : new Set(allKeys));
  };

  const handleConfirmRequest = () => {
    if (selected.size === 0) return;
    setStatus(STATUS.confirm);
  };

  const handleCancel = () => setStatus(STATUS.idle);

  const handleReset = async () => {
    setStatus(STATUS.running);

    const orderedKeys = resolveExecutionOrder([...selected]);

    // Marquer toutes les entités comme "en attente"
    const initProgress = {};
    orderedKeys.forEach((k) => { initProgress[k] = { status: "running" }; });
    setProgress(initProgress);

    const rapportsFinals = await runReset(orderedKeys, (key, rapport) => {
      setProgress((prev) => ({
        ...prev,
        [key]: { status: "done", deleted: rapport.deleted, failed: rapport.failed },
      }));
    });

    setRapports(rapportsFinals);
    setStatus(STATUS.done);
  };

  const handleRestart = () => {
    setSelected(new Set());
    setStatus(STATUS.idle);
    setProgress({});
    setRapports([]);
  };

  // ── Résumé global ────────────────────────────────────────────────────────────
  const totalDeleted = rapports.reduce((s, r) => s + (r.deleted || 0), 0);
  const totalFailed  = rapports.reduce((s, r) => s + (r.failed  || 0), 0);
  const isRunning    = status === STATUS.running;
  const isDone       = status === STATUS.done;

  return (
    <>
      {/* Animation spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {status === STATUS.confirm && (
        <ConfirmModal
          selectedKeys={resolveExecutionOrder([...selected])}
          onConfirm={handleReset}
          onCancel={handleCancel}
        />
      )}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: COLOR.danger.bg,
              border: `1.5px solid ${COLOR.danger.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🔁</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "#2C2C2A" }}>
                Reset Dolibarr
              </h1>
              <p style={{ fontSize: 13, color: "#888780", margin: 0 }}>
                Purge sélective des entités — irréversible
              </p>
            </div>
          </div>

          {/* Barre de progression globale */}
          {isRunning && (
            <div style={{
              marginTop: 16,
              background: "#F1EFE8",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#5F5E5A",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <Spinner />
              Reset en cours… veuillez patienter.
            </div>
          )}

          {/* Rapport global */}
          {isDone && (
            <div style={{
              marginTop: 16,
              background: totalFailed > 0 ? COLOR.warning.bg : COLOR.success.bg,
              border: `1.5px solid ${totalFailed > 0 ? COLOR.warning.border : COLOR.success.border}`,
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: totalFailed > 0 ? COLOR.warning.text : COLOR.success.text,
            }}>
              <strong>Reset terminé :</strong> {totalDeleted} entrée(s) supprimée(s)
              {totalFailed > 0 && ` · ${totalFailed} erreur(s) — vérifiez la console.`}
            </div>
          )}
        </div>

        {/* ── Sélection globale + bouton ──────────────────────────────────── */}
        {!isRunning && !isDone && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <button
              onClick={toggleAll}
              style={{
                fontSize: 13, background: "none", border: "none",
                color: "#378ADD", cursor: "pointer", padding: 0,
              }}
            >
              {selected.size === Object.keys(RESET_MODEL).length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </button>

            <button
              onClick={handleConfirmRequest}
              disabled={selected.size === 0}
              style={{
                padding: "9px 22px",
                background: selected.size > 0 ? COLOR.danger.badge : "#F0F0F0",
                color:      selected.size > 0 ? "#fff"             : "#B4B2A9",
                border: "none",
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 500,
                cursor: selected.size > 0 ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              {selected.size > 0
                ? `Réinitialiser (${selected.size})`
                : "Sélectionnez des entités"}
            </button>
          </div>
        )}

        {isDone && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button
              onClick={handleRestart}
              style={{
                padding: "9px 22px",
                background: "#378ADD",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Nouveau reset
            </button>
          </div>
        )}

        {/* ── Grille d'entités par groupe ─────────────────────────────────── */}
        {Object.entries(grouped).map(([group, entities]) => (
          <div key={group}>
            <GroupLabel name={group} />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}>
              {entities.map(({ key, ...entity }) => (
                <EntityCard
                  key={key}
                  entityKey={key}
                  entity={entity}
                  selected={selected.has(key)}
                  onChange={toggleEntity}
                  progress={progress[key] || null}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <p style={{
          marginTop: 40,
          fontSize: 12,
          color: "#B4B2A9",
          textAlign: "center",
          borderTop: "0.5px solid #D3D1C7",
          paddingTop: 16,
        }}>
          Les suppressions respectent l'ordre des dépendances et purgent les sous-éléments liés.
        </p>
      </div>
    </>
  );
}