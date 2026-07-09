const API_BASE = import.meta.env.VITE_DOLIBARR_URL;
const API_TOKEN = import.meta.env.VITE_DOLIBARR_TOKEN;

const headers = {
    "DOLAPIKEY": API_TOKEN,
    "Accept": "application/json",
    "Content-Type": "application/json"
};

const UserService = {
    // GET ALL
    getAll: async () => {
        const response = await fetch(`${API_BASE}/users`, { method: "GET", headers });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        const data = await response.json();
        return data.filter(user => user.is_deleted === false || user.is_deleted === 0 || user.status === "1");
    },

    // COUNT
    getUsersCount: async () => {
        const data = await UserService.getAll();
        return data.length;
    },

    // GET BY ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE}/users/${id}`, { method: "GET", headers });
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        return await response.json();
    },

    // CREATE
    create: async (userData) => {
        const response = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers,
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(`Erreur lors de la création: ${await response.text()}`);
        return await response.json(); // Renvoie l'ID généré
    },

    //UPDATE
    update: async (id, userData) => {
        const response = await fetch(`${API_BASE}/users/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(`Erreur lors de la mise à jour: ${await response.text()}`);
        return await response.json();
    },

    // DELETE
    delete: async (id) => {
        const response = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error(`Erreur lors de la suppression: ${await response.text()}`);
        return await response.json();
    },
    // mdp
    // Dans votre UserService adapté pour Dolibarr v23
    setPassword: async (userId, newPassword) => {
        const response = await fetch(`${API_BASE}/users/${userId}/password`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                password: newPassword
            })
        });
        if (!response.ok) throw new Error(`Erreur v23 lors de l'initialisation du mot de passe : ${await response.text()}`);
        return await response.json();
    },
    // maka  ref_empoyee 
    getRef_employee: async (refEmployeCsv) => {
        try {
            // 1. Récupérer tous les utilisateurs de Dolibarr
            const response = await fetch(`${API_BASE}/users?limit=1000`, {
                method: "GET",
                headers
            });

            if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
            const users = await response.json();

            if (!Array.isArray(users)) return null;

            // 2. Trouver l'utilisateur dont le fk_user (ou ref_employee) en BDD correspond au ref_employe du CSV
            const userTrouve = users.find(u =>
                String(u.fk_user) === String(refEmployeCsv).trim() ||
                String(u.ref_employee) === String(refEmployeCsv).trim()
            );

            if (!userTrouve) {
                console.error(`Aucun utilisateur trouvé pour l'employé CSV : ${refEmployeCsv}`);
                return null;
            }

            // 3. On retourne son 'id' principal (ex: 134). 
            // C'est cet ID que le module Salaire va utiliser comme clé étrangère (fk_user).
            return parseInt(userTrouve.id, 10);

        } catch (error) {
            console.error("Erreur lors de la recherche de l'employé :", error);
            return null;
        }
    },
    // maka genre ana user
    getUserGender: async (userId) => {
        const data = await UserService.getAll();

        const user = data.find(item => item.rowid == userId);

        return user ? user.gender : null;
    },

    // maka anle photo
    getUserPhoto: async (userId) => {
        try {
            // Le module "user" stocke ses fichiers dans un sous-dossier nommé avec l'ID de l'utilisateur
            const response = await fetch(`${API_BASE}/documents?modulepart=user&id=${userId}`, {
                method: "GET",
                headers
            });

            if (!response.ok) return null; // Si l'utilisateur n'a pas de photo, on ne bloque pas l'application

            const files = await response.json();

            // On cherche un fichier qui est une image (ex: .jpg, .png)
            const photoFile = files.find(file =>
                file.name.toLowerCase().endsWith('.jpg') ||
                file.name.toLowerCase().endsWith('.jpeg') ||
                file.name.toLowerCase().endsWith('.png')
            );

            if (!photoFile) return null;

            // Dolibarr v16+ / v23 renvoie souvent le contenu en base64 dans la propriété 'content'
            if (photoFile.content) {
                // On détecte l'extension pour le bon format MIME
                const ext = photoFile.name.split('.').pop().toLowerCase();
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                return `data:${mimeType};base64,${photoFile.content}`;
            }

            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de la photo :", error);
            return null;
        }
    },

    getAllPost: async () => {
        const data = await UserService.getAll();
        return data
            .filter(user => user.job)
            .map(user => ({
                userId: user.id,
                name: user.name,
                job: user.job,
            }));
    },

    // maka anaarana user fotsiny
    geName: async (userId) => {
        const data = await UserService.getAll();

        const user = data.find(item => item.id == userId);

        return user.lastname;
    },
    // maka heure de travail anah user
    getWeekHours: async (userId) => {
    const data = await UserService.getAll();
    const user = data.find(item => item.id === userId);

    if (!user) {
        throw new Error(`Utilisateur avec ID ${userId} introuvable`);
    }
    return user.weeklyhours ?? 0;
},
    // // maka id anah user am  salary id
    //  // GET ALL salaries BY user ID
    // getBySalaryID: async (salaryid) => {
    //     const data = await UserService.getAll();
    //     const salaries = data.filter(item => item.fk_user == salaryid);
    //     return salaries;
    // },

};

export default UserService;