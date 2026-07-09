import { useState, useCallback } from "react";
import UserService from "../UserService";
import SalariesService from "../SalariesService";
import JourFerieService from "../Backend/JourFerieService";
import PhotoBackService from "../Backend/PhotoBackService";
// const API_SPRINGBOOT_URL = import.meta.VITE_GLPI_SPRINGBOOT_URL;
// ─── Configuration ────────────────────────────────────────────────────────────
export const RESET_CONFIG = {
  payments: {
    group: "Paie",
    label: "Paiements salaires",
    order: 1,
    dependencies: [],
    description: "Supprime tous les paiements de salaires.",
  },

  salaries: {
    group: "Paie",
    label: "Salaires",
    order: 2,
    dependencies: ["payments"],
    description: "Supprime tous les salaires.",
  },

  users: {
    group: "Administration",
    label: "Utilisateurs",
    order: 3,
    dependencies: ["salaries"],
    description: "Supprime les utilisateurs (sauf admin).",
  },
  // RESET BACK 
 jourferie: {
    group: "Administration",
    label: "Jour Ferie",
    order: 3,
    dependencies: [],
    description: "Supprime les jours ferie.",
  },
  photouser: {
    group: "Administration",
    label: "Photo User",
    order: 3,
    dependencies: [],
    description: "Supprime les photos.",
  },
};
// ─── Utilitaires sélection ────────────────────────────────────────────────────
export const addDepsRecursive = (key, current) => {
  const deps = RESET_CONFIG[key]?.dependencies ?? [];
  const next = new Set(current);
  deps.forEach((dep) => {
    if (!next.has(dep)) {
      next.add(dep);
      addDepsRecursive(dep, next).forEach((k) => next.add(k));
    }
  });
  return next;
};

export const removeDependents = (key, current) => {
  let next = new Set(current);
  Object.keys(RESET_CONFIG).forEach((k) => {
    if (RESET_CONFIG[k].dependencies.includes(key) && next.has(k)) {
      next.delete(k);
      next = removeDependents(k, next);
    }
  });
  return next;
};

export const groupedEntries = () => {
  const groups = {};
  Object.entries(RESET_CONFIG).forEach(([key, cfg]) => {
    if (!groups[cfg.group]) groups[cfg.group] = [];
    groups[cfg.group].push(key);
  });
  return groups;
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDolibarrReset() {
  const [statuses, setStatuses] = useState({});
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, ts: Date.now() }]);
  }, []);

  const startReset = async (selected) => {
    if (running || selected.size === 0) return;
    setRunning(true);
    setLogs([]);
    setStatuses({});
    setProgress(0);

    const ordered = [...selected].sort(
      (a, b) => RESET_CONFIG[a].order - RESET_CONFIG[b].order
    );
    const total = ordered.length;

    addLog("→ Début de la purge Dolibarr…", "info");

    let done = 0;
    for (const key of ordered) {
      const { label } = RESET_CONFIG[key];
      setStatuses((p) => ({ ...p, [key]: "running" }));
      addLog(`→ Purge : ${label}…`, "info");

      try {
        if (key === "salaries") {
          const salaries = await SalariesService.getAll();

          if (!salaries || salaries.length === 0) {
            addLog("  ⚠ Aucun salaire trouvé.", "warn");
          } else {
            let countSalaries = 0;
            let countPayments = 0;

            for (const s of salaries) {
              const salaryId = s.id; // Le JSON confirme que c'est bien ".id"

              if (!salaryId) {
                addLog("Impossible de lire l'ID d'un salaire, ligne ignorée.", "warn");
                continue;
              }

              try {
                // 1. Récupérer les paiements rattachés à ce salaire (filtrés côté client)
                const payments = await SalariesService.getAllPaidByID(salaryId);

                if (payments && payments.length > 0) {
                  for (const p of payments) {
                    const paymentId = p.rowid ?? p.id; // selon le champ exact renvoyé par l'API
                    await SalariesService.deletePaid(paymentId);
                    countPayments++;
                  }
                }

                await SalariesService.delete(salaryId);
                countSalaries++;

              } catch (salaryError) {
                addLog(`  ✗ Échec de la suppression du salaire ID ${salaryId}: ${salaryError.message}`, "error");
              }
            }

            addLog(`  ✓ Purge terminée : ${countSalaries} salaire(s) et ${countPayments} paiement(s) supprimé(s).`, "ok");
          }
        }
        else if (key === "users") {
          const users = await UserService.getAll();
          const toDelete = users.filter((u) => String(u.id) !== "85");
          if (toDelete.length === 0) {
            addLog("  ⚠ Aucun utilisateur standard à supprimer.", "warn");
          } else {
            let count = 0;
            for (const u of toDelete) {
              await UserService.delete(u.id);
              count++;
            }
            addLog(`  ✓ ${count} utilisateur(s) supprimé(s). SuperAdmin préservé.`, "ok");
          }
        }

        // backend

        else if (key === "jourferie") {
          const listJours = await JourFerieService.getAll();

          if (listJours.length === 0) {
            addLog(" ⚠ Aucun jour férié à supprimer.", "warn");
          } else {
            let count = 0;
            // 2. Boucle pour supprimer chaque jour férié un par un
            for (const jf of listJours) {
              await JourFerieService.delete(jf.id);
              count++;
            }
            addLog(` ✓ ${count} jour(s) férié(s) supprimé(s) avec succès.`, "ok");
          }
        }

         else if (key === "photouser") {
          const listphoto = await PhotoBackService.getAll();

          if (listphoto.length === 0) {
            addLog(" ⚠ Aucun jour férié à supprimer.", "warn");
          } else {
            let count = 0;
            // 2. Boucle pour supprimer chaque jour férié un par un
            for (const jf of listphoto) {
              await PhotoBackService.delete(jf.id);
              count++;
            }
            addLog(` ✓ ${count} jour(s) férié(s) supprimé(s) avec succès.`, "ok");
          }
        }

        setStatuses((p) => ({ ...p, [key]: "done" }));
      } catch (e) {
        setStatuses((p) => ({ ...p, [key]: "error" }));
        addLog(`  ✗ Erreur sur ${label} : ${e.message}`, "error");
      }

      done++;
      setProgress(Math.round((done / total) * 100));
    }

    addLog(`─── Terminé : ${done}/${total} entité(s) traitée(s). ───`, "ok");
    setRunning(false);
  };

  return { statuses, logs, running, progress, startReset };
}
