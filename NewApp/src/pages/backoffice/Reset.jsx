import { useState, useRef } from "react";
import { RefreshIcon, InfoIcon } from "../../components/Icons";
import "../../assets/page/Reset.css";
import Sidebar from "../../components/Sidebar";

import {
  RESET_CONFIG,
  addDepsRecursive,
  removeDependents,
  groupedEntries,
  useDolibarrReset,
} from "../../services/ImportReset/ResetService";

// ─── Statut badge ─────────────────────────────────────────────────────────────
const STATUS_LABEL = { idle: "—", running: "En cours…", done: "OK", error: "Erreur" };
const STATUS_COLOR = {
  idle:    "bg-gray-100 text-gray-500",
  running: "bg-blue-100 text-blue-700",
  done:    "bg-green-100 text-green-700",
  error:   "bg-red-100 text-red-700",
};

// ─── Checkbox card ────────────────────────────────────────────────────────────
function EntityCheckbox({ entityKey, cfg, checked, onChange }) {
  return (
    <label
      className={[
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none",
        checked
          ? "border-red-200 bg-red-50/40"
          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(entityKey)}
        className="mt-0.5 w-4 h-4 accent-red-500 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">{cfg.label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{cfg.description}</p>
        {cfg.dependencies.length > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Dépend de :{" "}
            {cfg.dependencies.map((d) => RESET_CONFIG[d]?.label ?? d).join(", ")}
          </p>
        )}
      </div>
    </label>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Reset() {
  const [selected, setSelected]   = useState(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const logRef = useRef(null);

  const { statuses, logs, running, progress, startReset } = useDolibarrReset();

  // Auto-scroll journal
  const scrollLog = () =>
    setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);

  const toggleEntity = (key) => {
    if (running) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        return removeDependents(key, next);
      } else {
        next.add(key);
        return addDepsRecursive(key, next);
      }
    });
    setConfirmed(false);
  };

  const selectAll   = () => { setSelected(new Set(Object.keys(RESET_CONFIG))); setConfirmed(false); };
  const deselectAll = () => { setSelected(new Set()); setConfirmed(false); };

  const handleStart = () => {
    if (!confirmed || running || selected.size === 0) return;
    scrollLog();
    startReset(selected).then(() => setConfirmed(false));
  };

  const groups = groupedEntries();

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <Sidebar />
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900 flex items-center gap-2">
          <span className="text-red-500"><RefreshIcon size={18} /></span>
          Réinitialisation Dolibarr
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez les entités à purger. Les dépendances sont ajoutées automatiquement.
        </p>
      </div>

      {/* Barre de progression */}
      {running && (
        <div className="mb-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Avertissement */}
      {selected.size > 0 && !running && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
          <span className="shrink-0 mt-0.5"><InfoIcon size={14} /></span>
          <span>
            <strong>{selected.size} entité(s)</strong> seront supprimées définitivement.
            Cette opération est irréversible.
          </span>
        </div>
      )}

      {/* Liste des entités par groupe */}
      {Object.entries(groups).map(([group, keys]) => (
        <div key={group} className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
            {group}
          </p>
          <div className="flex flex-col gap-1.5">
            {keys.map((key) => {
              const status = statuses[key] ?? "idle";
              return (
                <div key={key} className="relative">
                  <EntityCheckbox
                    entityKey={key}
                    cfg={RESET_CONFIG[key]}
                    checked={selected.has(key)}
                    onChange={toggleEntity}
                  />
                  {running && (
                    <span
                      className={`absolute right-3 top-3 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirmation */}
      {selected.size > 0 && !running && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <input
            type="checkbox"
            id="confirm-check"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          <label htmlFor="confirm-check" className="text-sm text-gray-700 cursor-pointer select-none">
            Je comprends que cette opération est <strong>irréversible</strong>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleStart}
          disabled={!confirmed || running || selected.size === 0}
          className={[
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            confirmed && !running && selected.size > 0
              ? "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          {running ? "Purge en cours…" : "▶ Lancer la purge"}
        </button>
        <button
          onClick={selectAll}
          disabled={running}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Tout sélectionner
        </button>
        <button
          onClick={deselectAll}
          disabled={running}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Désélectionner
        </button>
        <span className="ml-auto text-sm text-gray-400">{selected.size} sélectionné(s)</span>
      </div>

      {/* Journal d'exécution */}
      {logs.length > 0 && (
        <div
          ref={logRef}
          className="mt-4 p-3 bg-gray-900 rounded-lg font-mono text-xs max-h-48 overflow-y-auto"
        >
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === "ok"    ? "text-green-400" :
                l.type === "error" ? "text-red-400"   :
                l.type === "warn"  ? "text-amber-400" :
                l.type === "info"  ? "text-blue-300"  : "text-gray-400"
              }
            >
              {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}