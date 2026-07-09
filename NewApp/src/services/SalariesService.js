const API_BASE = import.meta.env.VITE_DOLIBARR_URL;
const API_TOKEN = import.meta.env.VITE_DOLIBARR_TOKEN;
import { data } from "react-router-dom";
import JourFerieService from "./Backend/JourFerieService";

const headers = {
    "DOLAPIKEY": API_TOKEN,
    "Accept": "application/json",
    "Content-Type": "application/json"
};

const SalariesService = {
    // GET ALL salaire
    getAll: async () => {
        const response = await fetch(`${API_BASE}/salaries`, { method: "GET", headers });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        return await response.json();
    },

    // COUNT
    getSalariesCount: async () => {
        const data = await SalariesService.getAll();
        return data.length;
    },

    // GET BY ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE}/salaries/${id}`, { method: "GET", headers });
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        return await response.json();
    },
    // CREATE
    create: async (salaryData) => {
        const response = await fetch(`${API_BASE}/salaries`, {
            method: "POST",
            headers,
            body: JSON.stringify(salaryData)
        });
        if (!response.ok) throw new Error(`Erreur lors de la création: ${await response.text()}`);
        return await response.json();
    },

    // UPDATE
    update: async (id, salaryData) => {
        const response = await fetch(`${API_BASE}/salaries/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(salaryData)
        });
        if (!response.ok) throw new Error(`Erreur lors de la mise à jour: ${await response.text()}`);
        return await response.json();
    },

    // DELETE
    delete: async (id) => {
        const response = await fetch(`${API_BASE}/salaries/salary/${id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error(`Erreur lors de la suppression: ${await response.text()}`);

        // Gère le cas où Dolibarr répond sans corps (204 No Content)
        if (response.status === 204) return true;
        return await response.json();
    },
    // maka salaire ana user 1 
    getUserAmount: async (userId) => {
        const data = await SalariesService.getAll();

        const salary = data.find(item => item.fk_user == userId);

        return salary ? Number(salary.amount) : 0;
    },

    // GET ALL salaries BY user ID
    getByUserID: async (userId) => {
        const data = await SalariesService.getAll();
        const salaries = data.filter(item => item.fk_user == userId);
        return salaries;
    },


    // GET salary IDs BY user ID
    getByUserBySalaryID: async (userId) => {
        const data = await SalariesService.getAll();
        const salaries = data.filter(item => item.fk_user == userId);
        const salaryIds = salaries.map(item => item.id);
        return salaryIds;
    },


    // maka anle montant ao am salaire
    getSalaryAmountById: async (salaryId) => {
        try {
            const salary = await SalariesService.getById(salaryId);
            return salary ? Number(salary.amount) : 0;
        } catch (e) {
            console.error("Impossible de récupérer le montant du salaire", e);
            return 0;
        }
    },
    //==========================================================//
    //==========================================================//
    //    PAYEMENT  //
    //  create
    createPaid: async (salaryId, paymentData) => {
        // On récupère le montant depuis 'total' qui est défini dans ton composant
        const amountToPay = Number(paymentData.total);

        // 1. On passe la date et le montant à vérifier
        const { isFullyPaid, remainingAmount, totalSalaryAmount } = await SalariesService.CheckPaid(salaryId, paymentData.datep, amountToPay);

        // CAS 1 : Déjà soldé
        if (isFullyPaid) {
            throw new Error("Impossible d'enregistrer : Le salaire pour ce mois a déjà été réglé en totalité.");
        }

        // CAS 2 : Saisie supérieure au reste
        if (amountToPay > remainingAmount) {
            if (remainingAmount === totalSalaryAmount) {
                throw new Error(`Erreur : Le montant saisi (${amountToPay} €) dépasse le montant du salaire attendu (${totalSalaryAmount} €).`);
            } else {
                throw new Error(`Erreur : Le montant saisi (${amountToPay} €) dépasse le reste à payer. Il ne reste que ${remainingAmount} € à régler.`);
            }
        }

        // 2. Enregistrement auprès de Dolibarr
        const response = await fetch(`${API_BASE}/salaries/${salaryId}/payments`, {
            method: "POST",
            headers,
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) throw new Error(`Erreur lors de la création du paiement: ${await response.text()}`);
        return await response.json();
    },
    // getAll
    getAllPaid: async () => {
        const response = await fetch(`${API_BASE}/salaries/payments`, { method: "GET", headers });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        return await response.json();
    },
    // getAll paiemeny by id 
    getAllPaidByUserID: async (userId) => {
        try {
            // 1. On récupère tous les IDs de salaire liés à ce user
            const salaryIds = await SalariesService.getByUserBySalaryID(userId);

            if (!salaryIds || salaryIds.length === 0) return [];

            // 2. On récupère tous les paiements existants
            const response = await fetch(`${API_BASE}/salaries/payments`, {
                method: "GET",
                headers
            });
            if (response.status === 404) return [];
            if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);

            const allPayments = await response.json();

            // On normalise les IDs de salaire du user en string pour comparaison sûre
            const salaryIdsStr = salaryIds.map(id => String(id).trim());

            // 3. On filtre les paiements dont fk_salary correspond à un des salaires du user
            return allPayments.filter((p) => {
                const paymentSalaryId = p.fk_salary && typeof p.fk_salary === 'object'
                    ? (p.fk_salary.rowid || p.fk_salary.id)
                    : p.fk_salary;

                return salaryIdsStr.includes(String(paymentSalaryId).trim());
            });

        } catch (e) {
            console.error("Impossible de récupérer les paiements du user", e);
            return [];
        }
    },

    // maka pauemen 1/1 anah salarie
    getByIdPaid: async (salaryId, paymentId) => {
        const response = await fetch(`${API_BASE}/salaries/${salaryId}/payments/${paymentId}`, {
            method: "GET",
            headers
        });
        if (!response.ok) throw new Error(`Erreur lors de la récupération du paiement: ${await response.text()}`);
        return await response.json();
    },

    // getAll paiemeny by id 
    getAllPaidByID: async (salaryId) => {
        const response = await fetch(`${API_BASE}/salaries/payments`, {
            method: "GET",
            headers
        });
        if (response.status === 404) return []; // aucun paiement du tout en base
        if (!response.ok) throw new Error(`Erreur lors de la récupération des paiements: ${await response.text()}`);
        const all = await response.json();
        return all.filter((p) => String(p.fk_salary) === String(salaryId));
    },




    // UPDATE : Modifier un paiement existant
    updatePaid: async (salaryId, paymentId, paymentData) => {
        const response = await fetch(`${API_BASE}/salaries/${salaryId}/payments/${paymentId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(paymentData)
        });
        if (!response.ok) throw new Error(`Erreur lors de la modification du paiement: ${await response.text()}`);
        return await response.json();
    },

    // DELETE : Supprimer un paiement
    deletePaid: async (paymentId) => {
        const response = await fetch(`${API_BASE}/salaries/${paymentId}/payments`, {
            method: "DELETE",
            headers
        });
        if (!response.ok) throw new Error(`Erreur suppression du paiement ${paymentId}: ${await response.text()}`);
        return response.status === 204 ? true : await response.json();
    },

    // maka ref salaire ao am paiement 
    getRefSalary: async (salaryId) => {
        const data = await SalariesService.getAllPaid();

        const salary = data.find(item => item.fk_salary == salaryId);

        return salary ? Number(salary.amount) : 0;
    },
    //     // get date deja ao
    //     getDateSalaire: async(salaryId); => {
    //     const response = await SalariesService.getById(salaryId);
    //     const salary = data.find(item => item.fk_salary == salaryId);
    //     return salary ? Number(salary.amount) : 0;

    // }

    // maka nombre anah jour entre datedeb et fin
    calculerNbJours: async (id) => {
        const data = await SalariesService.getById(id);
        const date_debut = data.datesp; // Start 
        const date_fin = data.dateep;   // End 
        const secondesParJour = 86400;
        const differenceEnSecondes = date_fin - date_debut;

        // 4. Retourne le résultat arrondi
        return Math.round(differenceEnSecondes / secondesParJour);
    },


    //==========================================================//
    //==========================================================//
    //    Autre   //

    // check
    CheckPaid: async (salaryId, targetTimestamp, amountToPay) => {
        try {
            // 1. On récupère le montant attendu pour CE salaire précis
            const totalSalaryAmount = await SalariesService.getSalaryAmountById(salaryId);
            if (totalSalaryAmount === 0) {
                throw new Error("Le salaire spécifié n'existe pas ou n'a pas de montant défini.");
            }

            // 2. Récupérer tous les paiements liés à ce salaire
            const allPayments = await SalariesService.getAllPaidByID(salaryId);

            // 3. Extraire le mois et l'année de la date cible
            const targetDate = new Date(Number(targetTimestamp) * 1000);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();

            // 4. Filtrer les paiements déjà effectués pour ce mois spécifique
            const targetMonthPayments = allPayments.filter(payment => {
                if (!payment.datep) return false;
                const paymentDate = new Date(Number(payment.datep) * 1000);
                return paymentDate.getMonth() === targetMonth && paymentDate.getFullYear() === targetYear;
            });

            // 5. Sommer les paiements existants
            const totalPaidThisMonth = targetMonthPayments.reduce((sum, payment) => {
                return sum + Number(payment.amount || payment.total || 0);
            }, 0);

            // 6. Calculer le reste à payer avec arrondi de sécurité pour les floats
            const remainingAmount = Math.round((totalSalaryAmount - totalPaidThisMonth) * 100) / 100;
            const finalRemaining = Math.max(0, remainingAmount);

            console.log(`[CheckPaid] Requis: ${totalSalaryAmount} | Déjà payé: ${totalPaidThisMonth} | Reste: ${finalRemaining} | Tentative: ${amountToPay}`);

            return {
                isFullyPaid: finalRemaining <= 0,
                remainingAmount: finalRemaining,
                totalSalaryAmount: totalSalaryAmount
            };

        } catch (error) {
            console.error("Erreur lors de la vérification du paiement :", error);
            throw error; // On remonte l'erreur pour la bloquer dans le front
        }
    },

    //  mi calcul RESTE
    getRestPaid: (salary, totalPaid) => {
        return Number(salary) - Number(totalPaid);
    },
    //
    // Vérifie si un salaire chevauche un jour férié
    checkFerieInSalary: async (salaryId) => {
        const joursFeries = await JourFerieService.getAll();
        const salaire = await SalariesService.getById(salaryId);

        if (!salaire) {
            throw new Error(`Salaire avec l'ID ${salaryId} introuvable.`);
        }

        // 1. On récupère les dates réelles du salaire (ex: 01/12/2026 au 31/12/2026)
        const debutsal = new Date(salaire.datesp * 1000);
        const finsal = new Date(salaire.dateep * 1000);
        debutsal.setHours(0, 0, 0, 0);
        finsal.setHours(0, 0, 0, 0);

        let nombreJoursFeriesTotal = 0;
        const feriesDansIntervalle = [];

        // On extrait les années de la période de salaire (ex: 2026)
        const anneeDebut = debutsal.getFullYear();
        const anneeFin = finsal.getFullYear();

        // 2. On boucle sur vos jours fériés "modèles"
        for (const jour of joursFeries) {
            const dateOrigine = new Date(jour.dateDebut); // ex: 25/12/2025 en BDD

            const moisFerie = dateOrigine.getMonth(); // ex: 11 (Décembre en JS)
            const jourFerie = dateOrigine.getDate();  // ex: 25

            // On teste le jour/mois férié pour chaque année couverte par le salaire
            for (let annee = anneeDebut; annee <= anneeFin; annee++) {

                // ICI : On recrée le 25/12 mais avec l'année du salaire (2026)
                const ferieProjette = new Date(annee, moisFerie, jourFerie, 0, 0, 0, 0);

                // Vérification : Est-ce que le 25/12/2026 est entre le début et la fin du salaire ?
                const chevauche = ferieProjette >= debutsal && ferieProjette <= finsal;

                if (chevauche) {
                    nombreJoursFeriesTotal += 1; // C'est un jour unique (le 25/12)

                    // On ajoute le jour férié aux détails s'il n'y est pas déjà
                    if (!feriesDansIntervalle.includes(jour)) {
                        feriesDansIntervalle.push(jour);
                    }
                }
            }
        }

        return {
            existe: feriesDansIntervalle.length > 0,
            nombreDePeriodes: feriesDansIntervalle.length,
            nombreDeJours: nombreJoursFeriesTotal,
            details: feriesDansIntervalle,
        };
    },

    // get jour mbola tss date 
    getJourPasSalaire: async (userId, month, year) => {
        const salaries = await SalariesService.getByUserID(userId);

        const targetMonth = Number(month); // 1 à 12
        const targetYear = Number(year);

        const start = new Date(targetYear, targetMonth - 1, 1);
        const end = new Date(targetYear, targetMonth, 0);

        const pad = (n) => String(n).padStart(2, "0");
        const toKey = (date) =>
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

        const coveredDays = new Set();

        for (const salary of salaries) {
            const startTs = Number(salary.datesp);
            const endTs = Number(salary.dateep);

            if (!startTs || !endTs) continue;

            const salaryStart = new Date(startTs * 1000);
            const salaryEnd = new Date(endTs * 1000);

            const current = new Date(salaryStart);
            while (current <= salaryEnd) {
                if (
                    current.getFullYear() === targetYear &&
                    current.getMonth() === targetMonth - 1
                ) {
                    coveredDays.add(toKey(current));
                }
                current.setDate(current.getDate() + 1);
            }
        }

        const missingDates = [];
        const current = new Date(start);

        while (current <= end) {
            const key = toKey(current);
            if (!coveredDays.has(key)) {
                missingDates.push(key);
            }
            current.setDate(current.getDate() + 1);
        }

        return missingDates;
    },


    // Calcule un salaire "Alea" : les jours du mois pas encore couverts par un
    // salaire existant, avec majoration (%) sur les jours fériés, et prise en
    // compte optionnelle du samedi/dimanche comme jours travaillés (majoration
    // weekend séparée). Si un jour est à la fois férié et weekend travaillé, on
    // applique la plus grande des deux majorations, sans les cumuler.
    // Retourne : { missingDates, nbTotal, nbFeries, nbWeekendMajores, total }
    calculerSalaireAlea: async (
        userId, mois, annee, salaireJour, pourcentageFerie,
        travailleSamedi = false, travailleDimanche = false, pourcentageWeekend = 0
    ) => {
        // 1. Jours du mois pas encore payés pour cet utilisateur
        const missingDatesBrutes = await SalariesService.getJourPasSalaire(userId, mois, annee);

        // Reconstruction d'une Date locale à partir de la clé "YYYY-MM-DD" pour lire
        // le jour de la semaine — ne pas passer la chaîne brute à `new Date(...)`,
        // ambigu selon les moteurs JS (voir DOC_PAIEMENT_PAR_MOIS.md section 12).
        const dateDeKey = (key) => {
            const [y, m, d] = key.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        // 2. Un samedi/dimanche décoché n'est pas travaillé : on le retire du
        // décompte des jours à payer.
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

        // 3. Jours fériés "modèles" en base → set de couples "mois-jour" (indépendant de l'année)
        const joursFeries = await JourFerieService.getAll();
        const feriesMoisJour = new Set(
            joursFeries.map((jf) => {
                const d = new Date(jf.dateDebut);
                return `${d.getMonth()}-${d.getDate()}`;
            })
        );

        // 4. Montant jour par jour : la plus grande des majorations applicables ce jour-là
        const taux = Number(salaireJour);
        let total = 0;
        let nbFeries = 0;
        let nbWeekendMajores = 0;

        for (const key of missingDates) {
            const [, m, d] = key.split("-").map(Number); // clé "YYYY-MM-DD", m = 1-12
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

    //
    checkFerie: async (date_debut, date_fin) => {
    // 1. Validation des entrées
    if (!date_debut || !date_fin) {
        throw new Error("Les dates de début et de fin sont obligatoires.");
    }

    // On s'assure d'avoir des objets Date et on réinitialise les heures pour comparer uniquement les jours
    const dDebut = new Date(date_debut);
    const dFin = new Date(date_fin);
    dDebut.setHours(0, 0, 0, 0);
    dFin.setHours(0, 0, 0, 0);

    const joursFeries = await JourFerieService.getAll();
    const feriesDansIntervalle = [];
    let nombreJoursFeriesTotal = 0;

    // On extrait les années de début et de fin de l'intervalle
    const anneeDebut = dDebut.getFullYear();
    const anneeFin = dFin.getFullYear();

    // 2. On boucle sur les jours fériés de la base de données
    for (const jour of joursFeries) {
        const dateOrigine = new Date(jour.dateDebut); 
        
        // Extraction correcte du mois (0-11) et du jour (1-31)
        const moisFerie = dateOrigine.getMonth(); 
        const jourFerie = dateOrigine.getDate();  

        // On teste le jour férié pour chaque année de la période demandée
        for (let annee = anneeDebut; annee <= anneeFin; annee++) {
            
            // Projection du jour férié sur l'année en cours de traitement
            const ferieProjette = new Date(annee, moisFerie, jourFerie, 0, 0, 0, 0);

            // Vérification si le jour férié projeté tombe dans l'intervalle
            const chevauche = ferieProjette >= dDebut && ferieProjette <= dFin;

            if (chevauche) {
                nombreJoursFeriesTotal += 1;

                // Évite les doublons dans le tableau de détails
                const dejaAjoute = feriesDansIntervalle.some(f => f.id === jour.id); // Utilise 'id' ou une clé unique de ton modèle
                if (!dejaAjoute) {
                    feriesDansIntervalle.push(jour);
                }
            }
        }
    }

    return {
        existe: feriesDansIntervalle.length > 0,
        nombreDePeriodes: feriesDansIntervalle.length,
        nombreDeJours: nombreJoursFeriesTotal,
        details: feriesDansIntervalle,
    };
}
};

export default SalariesService;

