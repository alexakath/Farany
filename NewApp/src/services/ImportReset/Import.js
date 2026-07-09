import { useState, useCallback } from "react";
import UserService from "../UserService";
import SalariesService from "../SalariesService";
import DocumentService from "../DocumentService";
import PhotoBackService from "../Backend/PhotoBackService";

export function useDolibarrImporter() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, ts: Date.now() }]);
  }, []);

  const runImport = async (files, imagesZip) => {
    setRunning(true);
    setLogs([]);
    setProgress(0);

    // Dictionnaire pour lier la "ref_employe" (CSV) → ID Dolibarr
    const employeeMapping = {};

    //  FIX : salaryMapping déclaré ICI, une seule fois, avant toutes les boucles
    // Structure : { "ref_salaire_CSV": salaryId_Dolibarr }
    const salaryMapping = {};

    const totalLines =
      (files.feuille1.data?.length || 0) +
      (files.feuille2.data?.length || 0);

    let processedLines = 0;
    const updateProgress = () => {
      processedLines++;
      if (totalLines > 0) setProgress(Math.round((processedLines / totalLines) * 100));
    };

    // nomralise les colonone 
    // Normalise les clés d'un objet en minuscules (et trim)
    const normalizeRowKeys = (row) => {
      const normalized = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          normalized[key.trim().toLowerCase()] = row[key];
        }
      }
      return normalized;
    };
    try {
      // =====================================================================
      // ETAPE 1 : IMPORTATION DES EMPLOYES (FICHIER 1) + PHOTOS (ZIP)
      // =====================================================================
      if (files.feuille1.data) {
        addLog("[1/2] Importation des employés et des photos...", "info");

        for (const rawRow of files.feuille1.data) {
          const row = normalizeRowKeys(rawRow);
          const refEmploye = row.ref_employe?.trim();
          const nom = row.nom?.trim();
          if (!refEmploye || !nom) {
            addLog(`⚠️ Ligne ignorée : 'ref_employe' ou 'nom' manquant.`, "warn");
            updateProgress();
            continue;
          }
          try {
            const userPayload = {
              ref_ext: refEmploye,
              fk_user: refEmploye,
              lastname: nom,
              login: row.identifiant?.trim(),
              pass: row.mdp?.trim(),
              gender: row.genre?.trim() === "homme" ? "man" : "woman",
              weeklyhours: parseFloat(row.heure_travail_semaine) || 35,
              status: "1",
              job: row.poste
            };

            const newUserId = await UserService.create(userPayload);
            employeeMapping[refEmploye] = newUserId;
            addLog(`✓ Employé "${nom}" créé avec succès (ID Dolibarr: ${newUserId}).`, "ok");

            if (imagesZip && imagesZip[refEmploye]) {
              addLog(`Image trouvée pour la référence ${refEmploye}. Envoi à Dolibarr...`);
              const photoData = imagesZip[refEmploye];

              // Récupération de l'extension d'origine (.png, .jpg...)
              const extension = photoData.filename.split('.').pop();

              // 1. On renomme le fichier avec l'ID Dolibarr (ex: "74.png")
              const imageProfileName = `${newUserId}.${extension}`;

              const base64Content = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(photoData.blob);
                reader.onloadend = () => resolve(reader.result.split(",")[1]);
              });

              // 2. Envoi avec les bons paramètres de dossier pour la v23
              await DocumentService.upload(
                imageProfileName,               // Le nom corrigé (ex: 74.png)
                "user",                         // Le module concerné
                base64Content,                  // Le contenu de l'image
                `${newUserId}/photos/thumbs`    // Le sous-dossier de l'utilisateur
              );

              addLog(`Photo "${imageProfileName}" associée et configurée comme photo de profil sur Dolibarr !`, "ok");

              // ─── AJOUT : Enregistrement dans SQLite via l'API Spring Boot ───
              try {
                addLog(`Enregistrement de la photo dans SQLite pour l'employé ID: ${newUserId}...`);

                const sqlitePhotoPayload = {
                  userId: newUserId, // L'ID Dolibarr généré
                  filename: imageProfileName // Le nom du fichier (ex: 74.png)
                };

                await PhotoBackService.create(sqlitePhotoPayload);
                addLog(`✓ Photo "${imageProfileName}" enregistrée avec succès dans la base SQLite.`, "ok");

              } catch (sqliteErr) {
                addLog(`⚠️ Erreur lors de l'enregistrement de la photo dans SQLite: ${sqliteErr.message}`, "warn");
                // On met un log d'avertissement mais on ne bloque pas le script principal si seul SQLite échoue
              }
              // ─────────────────────────────────────────────────────────────────
            }

          } catch (err) {
            addLog(`✗ Erreur lors de la création de l'employé "${nom}": ${err.message}`, "error");
          }
          updateProgress();
        }
      }

      // =====================================================================
      // ETAPE 2 : IMPORTATION DES SALAIRES (FICHIER 2)
      // =====================================================================
      if (files.feuille2.data) {
        addLog("[2/2] Importation des enregistrements de salaires et paiements...", "info");

        // Parsées en UTC (Date.UTC), pas en heure locale : Dolibarr tronque les
        // timestamps en date calendaire côté UTC, donc un "T00:00:00" en heure
        // locale (ex: UTC+3) décale la date d'un jour vers le passé une fois
        // relue. Date.UTC garantit que la date calendaire envoyée est bien celle
        // qui revient, quel que soit le fuseau horaire du navigateur.
        const toUnixTimestamp = (dateStr) => {
          if (!dateStr) return null;
          const clean = dateStr.trim();
          if (/^\d{2}\/\d{2}\/\d{2}$/.test(clean)) {
            const [d, m, y] = clean.split("/");
            return Math.floor(Date.UTC(2000 + Number(y), Number(m) - 1, Number(d)) / 1000);
          }
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
            const [d, m, y] = clean.split("/");
            return Math.floor(Date.UTC(Number(y), Number(m) - 1, Number(d)) / 1000);
          }
          return null;
        };

        const parseMontant = (raw) => {
          if (raw === undefined || raw === null) return 0;
          const str = String(raw).trim().replace(",", ".");
          const val = parseFloat(str);
          return isNaN(val) ? 0 : val;
        };

        const parsePaiements = (paiementStr) => {
          if (!paiementStr || paiementStr.trim() === "") return [];
          const listePaiements = [];
          const regex = /\[\s*"([^"]+)"\s*,\s*([\d.,]+)\s*\]/g;
          let match;
          while ((match = regex.exec(paiementStr)) !== null) {
            listePaiements.push({ dateRaw: match[1], montantRaw: match[2] });
          }
          return listePaiements;
        };

        for (const rawRow of files.feuille2.data) {
           const row = normalizeRowKeys(rawRow);
          const refEmploye = row.ref_employe?.trim();

          if (!refEmploye || !row.ref_salaire) {
            updateProgress();
            continue;
          }

          // --- CORRECTION ET SÉCURISATION DE L'ID USER ---
          // Étape 1 : On vérifie si on a déjà l'ID en cache locale
          let dolibarrUserId = employeeMapping[refEmploye];

          // Étape 2 : Si non trouvé, on tente l'appel API de secours
          if (!dolibarrUserId) {
            try {
              console.log(`Recherche via API pour l'employé réf: ${refEmploye}`);
              dolibarrUserId = await UserService.getRef_employee(refEmploye);
            } catch (apiErr) {
              console.error("Échec de la recherche API de l'employé:", apiErr.message);
            }
          }

          // Étape 3 : Si on n'a toujours rien, on passe la ligne plutôt que de planter au payload
          if (!dolibarrUserId) {
            addLog(`⚠️ Salaire ignoré : l'ID de l'employé réf "${refEmploye}" est introuvable.`, "warn");
            updateProgress();
            continue;
          }

          try {
            const dateDebut = toUnixTimestamp(row.date_debut);
            const dateFin = toUnixTimestamp(row.date_fin);
            const montant = parseMontant(row.montant);

            if (!dateDebut || !dateFin) {
              throw new Error(`Date invalide — date_debut: "${row.date_debut}", date_fin: "${row.date_fin}"`);
            }
            if (montant <= 0) {
              throw new Error(`Montant invalide ou nul : "${row.montant}"`);
            }

            // Utilisation directe de l'ID entier validé (ex: 134)
            const salaryPayload = {
              ref: String(row.ref_salaire).trim(),
              ref_ext: String(row.ref_salaire).trim(),
              label: `Période du ${row.date_debut} au ${row.date_fin}`,
              fk_user: parseInt(dolibarrUserId, 10),
              datesp: dateDebut,
              dateep: dateFin,
              datep: dateDebut,
              salary: montant,
              amount: montant,
              note_public: row.paiement
                ? `Paiements planifiés : ${row.paiement}`
                : "Importé par script d'intégration",
            };
            console.log("Envoi du payload salaire :", salaryPayload);
            const createdSalary = await SalariesService.create(salaryPayload);

            let salaryId = null;
            if (createdSalary && typeof createdSalary === "object") {
              salaryId = createdSalary.id || createdSalary.rowid || Object.values(createdSalary)[0];
            } else {
              salaryId = createdSalary;
            }
            if (!salaryId) {
              throw new Error("Impossible de récupérer l'ID du salaire créé par Dolibarr.");
            }

            salaryMapping[row.ref_salaire] = salaryId;
            console.log(`salaryMapping mis à jour : ref_CSV "${row.ref_salaire}" → ID Dolibarr ${salaryId}`);

            addLog(`✓ Salaire ${montant} € enregistré (ID Dolibarr: ${salaryId}) pour l'employé réf "${refEmploye}".`, "ok");

            const paiementsExtraits = parsePaiements(row.paiement);

            for (const p of paiementsExtraits) {
              try {
                const datePaiementUnix = toUnixTimestamp(p.dateRaw);
                const montantPaiement = parseMontant(p.montantRaw);

                if (!datePaiementUnix || montantPaiement <= 0) {
                  addLog(`  ⚠️ Paiement ignoré (format invalide) : Date "${p.dateRaw}", Montant "${p.montantRaw}"`, "warn");
                  continue;
                }
                const paymentPayload = {
                  datep: datePaiementUnix,
                  datepaye: datePaiementUnix,     // ou "2026-07-01" selon ce que l'API attend
                  paiementtype: 1,               // ou fk_typepayment: 1 suivant ton endpoint
                  chid: 1,
                  amount: Number(montantPaiement),
                  amounts: {
                    [salaryId]: Number(montantPaiement)
                  },
                  accountid: 1
                };
                console.log("Création paiement — payload corrigé:", paymentPayload);

                // Appel à votre service avec le payload mis à jour
                await SalariesService.createPaid(salaryId, paymentPayload);

                addLog(`  ↳ ✓ Paiement de ${montantPaiement} € créé avec succès pour la date du ${p.dateRaw}.`, "ok");

              } catch (payErr) {
                addLog(`  ↳ ✗ Erreur lors de la création du paiement (${p.dateRaw} - ${p.montantRaw}€): ${payErr.message}`, "error");
              }
            }

          } catch (err) {
            addLog(`✗ Erreur sur le salaire réf "${row.ref_salaire}" (employé ${refEmploye}): ${err.message}`, "error");
          }

          updateProgress();
        }
      }
      addLog("🏁 Importation Dolibarr terminée avec succès !", "info");
    } catch (gErr) {
      addLog(`❌ Erreur générale de traitement : ${gErr.message}`, "error");
    } finally {
      setRunning(false);
    }
  };

  return { running, progress, logs, runImport };
}
