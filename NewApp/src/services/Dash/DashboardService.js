import UserService from "../UserService";
import SalariesService from "../SalariesService";

const DashboardService = {

    // SOMME DES MONTANTS PAR GENRE
    getTotalAmountByGender: async (gender) => {
        try {
            const users = await UserService.getAll();
            const paiements = await SalariesService.getAllPaid();
            const salaires = await SalariesService.getAll();

            // S'assurer que tout est nettoyé et converti en String pour la comparaison
            const userGenderMap = new Map();
            users.forEach(user => {
                // Dolibarr utilise parfois 'id' ou 'rowid'
                const id = user.rowid || user.id;
                if (id) userGenderMap.set(String(id).trim(), String(user.gender).toLowerCase().trim());
            });

            const salaryToUserMap = new Map();
            salaires.forEach(sal => {
                const id = sal.rowid || sal.id;
                if (id && sal.fk_user) {
                    salaryToUserMap.set(String(id).trim(), String(sal.fk_user).trim());
                }
            });

            let total = 0;
            const targetGender = String(gender).toLowerCase().trim();

            paiements.forEach(payment => {
                if (!payment.fk_salary) return;

                const salaryId = String(payment.fk_salary).trim();
                const userId = salaryToUserMap.get(salaryId);

                if (userId) {
                    const userGender = userGenderMap.get(userId);

                    if (userGender === targetGender) {
                        // Transformation stricte du montant en Nombre flottant
                        const montantId = parseFloat(payment.amount);
                        if (!isNaN(montantId)) {
                            total += montantId;
                        }
                    }
                }
            });

            return total;
        } catch (error) {
            console.error("Erreur calcul dashboard:", error);
            return 0;
        }
    },
    //  DETAILS PAR GENRE
    getAmountByGenderDetails: async () => {
        try {
            const users = await UserService.getAll();
            const paiements = await SalariesService.getAllPaid();
            const salaires = await SalariesService.getAll();

            const userMap = new Map();
            users.forEach(u => {
                const id = u.rowid || u.id;
                if (id) userMap.set(String(id).trim(), u);
            });

            const salaryToUserMap = new Map();
            salaires.forEach(s => {
                const id = s.rowid || s.id;
                if (id && s.fk_user) salaryToUserMap.set(String(id).trim(), String(s.fk_user).trim());
            });

            const result = {};

            paiements.forEach(payment => {
                if (!payment.fk_salary) return;

                const salaryId = String(payment.fk_salary).trim();
                const userId = salaryToUserMap.get(salaryId);
                const user = userMap.get(userId);

                if (!user) return;

                const gender = String(user.gender || "unknown").toLowerCase().trim();
                const montant = parseFloat(payment.amount || 0);

                if (isNaN(montant)) return;

                if (!result[gender]) {
                    result[gender] = {
                        total: 0,
                        users: []
                    };
                }

                result[gender].total += montant;
                result[gender].users.push({
                    userId: user.rowid || user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    amount: montant
                });
            });

            return result;
        } catch (error) {
            console.error("Erreur détails dashboard:", error);
            return {};
        }
    },

    // SOMME PAR MOIS
    // À insérer à l'intérieur de votre objet DashboardService, après vos autres méthodes

    getAmountByMonth: async () => {
    try {
        // 1. On récupère les paiements ET les salaires
        const [paiements, salaires] = await Promise.all([
            SalariesService.getAllPaid(),
            SalariesService.getAll()
        ]);

        const result = {};
        const moisEnFrancais = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];

        // 2. On crée un dictionnaire (Map) des salaires pour une recherche ultra rapide par ID
        const salairesMap = new Map(salaires.map(s => [String(s.id), s]));

        paiements.forEach(payment => {
            // Extraction de l'ID du salaire lié au paiement
            const salaryId = payment.fk_salary && typeof payment.fk_salary === 'object'
                ? (payment.fk_salary.rowid || payment.fk_salary.id)
                : payment.fk_salary;

            if (!salaryId) return;

            // 3. On récupère le salaire correspondant pour avoir son "datesp"
            const correspondantSalary = salairesMap.get(String(salaryId));
            if (!correspondantSalary || !correspondantSalary.datesp) return;

            // 4. Récupération du timestamp du SALAIRE (datesp) au lieu du paiement (datep)
            const timestampInSeconds = Number(correspondantSalary.datesp);
            if (!timestampInSeconds || isNaN(timestampInSeconds)) return;

            // 5. Conversion et formatage de la date
            const date = new Date(timestampInSeconds * 1000);
            const year = date.getFullYear();
            const monthIndex = date.getMonth(); 
            const monthLabel = moisEnFrancais[monthIndex];

            const key = `${year}-${monthLabel}`;

            // 6. Extraction du montant du paiement
            const montant = parseFloat(payment.amount || payment.total || 0);
            if (isNaN(montant)) return;

            // 7. Accumulation
            if (!result[key]) {
                result[key] = 0;
            }
            result[key] += montant;
        });

        return result;
    } catch (error) {
        console.error("Erreur lors du calcul de la somme par mois de salaire:", error);
        return {};
    }
}
};

export default DashboardService;
