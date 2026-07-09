import UserService from "../UserService";
import SalariesService from "../SalariesService";

const DashboardSalService = {

    // 1. SOMME DES SALAIRES ATTENDUS PAR GENRE
    getTotalSalaryAmountByGender: async (gender) => {
        try {
            const users = await UserService.getAll();
            const salaires = await SalariesService.getAll();

            // Associer l'ID de l'utilisateur à son genre
            const userGenderMap = new Map();
            users.forEach(user => {
                const id = user.rowid || user.id;
                if (id) userGenderMap.set(String(id).trim(), String(user.gender).toLowerCase().trim());
            });

            let total = 0;
            const targetGender = String(gender).toLowerCase().trim();

            salaires.forEach(sal => {
                if (!sal.fk_user) return;

                const userId = String(sal.fk_user).trim();
                const userGender = userGenderMap.get(userId);

                // Si le genre correspond, on ajoute le montant du salaire de base
                if (userGender === targetGender) {
                    const montantSalaire = parseFloat(sal.amount);
                    if (!isNaN(montantSalaire)) {
                        total += montantSalaire;
                    }
                }
            });

            return total;
        } catch (error) {
            console.error("Erreur calcul dashboard salaires par genre:", error);
            return 0;
        }
    },

    // 2. DÉTAILS DES SALAIRES PAR GENRE (Avec la liste des employés)
    getSalaryAmountByGenderDetails: async () => {
        try {
            const users = await UserService.getAll();
            const salaires = await SalariesService.getAll();

            // Cartographie complète des utilisateurs
            const userMap = new Map();
            users.forEach(u => {
                const id = u.rowid || u.id;
                if (id) userMap.set(String(id).trim(), u);
            });

            const result = {};

            salaires.forEach(sal => {
                if (!sal.fk_user) return;

                const userId = String(sal.fk_user).trim();
                const user = userMap.get(userId);

                if (!user) return;

                const gender = String(user.gender || "unknown").toLowerCase().trim();
                const montantSalaire = parseFloat(sal.amount || 0);

                if (isNaN(montantSalaire)) return;

                if (!result[gender]) {
                    result[gender] = {
                        total: 0,
                        users: []
                    };
                }

                result[gender].total += montantSalaire;
                result[gender].users.push({
                    userId: user.rowid || user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    expectedSalary: montantSalaire
                });
            });

            return result;
        } catch (error) {
            console.error("Erreur détails dashboard salaires:", error);
            return {};
        }
    },

    // 3. SOMME DES SALAIRES PAR MOIS / DATE DE CRÉATION
    getSalaryAmountByMonth: async () => {
        try {
            const salaires = await SalariesService.getAll();
            const result = {};

            const moisEnFrancais = [
                "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
            ];

            salaires.forEach(sal => {
                let year, monthIndex;

                // CORRECTION : Extraction prioritaire et fiable depuis la date de début du label string
                if (sal.label && sal.label.includes("Période du")) {
                    const match = sal.label.match(/Période du (\d{2})\/(\d{2})\/(\d{4})/);
                    if (match) {
                        year = parseInt(match[3], 10);
                        monthIndex = parseInt(match[2], 10) - 1; // -1 car les mois vont de 0 a 11 en JS
                    }
                }

                // Sécurité / Fallback : Si le format du label change ou est absent, on retourne sur le timestamp
                if (!year || monthIndex === undefined) {
                    const timestampInSeconds = Number(sal.datesp);
                    if (!timestampInSeconds || isNaN(timestampInSeconds)) return;

                    const date = new Date(timestampInSeconds * 1000);
                    year = date.getFullYear();
                    monthIndex = date.getMonth();
                }

                const monthLabel = moisEnFrancais[monthIndex];
                const key = `${monthLabel}-${year}`;

                const montantSalaire = parseFloat(sal.amount || 0);
                if (isNaN(montantSalaire)) return;

                if (!result[key]) {
                    result[key] = 0;
                }
                result[key] += montantSalaire;
            });

            return result;
        } catch (error) {
            console.error("Erreur lors du calcul de la somme des salaires par mois:", error);
            return {};
        }
    }
};

export default DashboardSalService;