const API_SPRINGBOOT_URL = import.meta.env.VITE_GLPI_SPRINGBOOT_URL;

const JourFerieService = {

    // getAll 
    getAll: async () => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/periodes-ferie`);
        if (!response.ok) {
            throw new Error("Erreur lors d'api Spring");
        }
        return response.json();
    },
    // deleteLast
    delete: async (idJourFe) => {
        const response = await fetch(
            // Ajustement de l'URL pour pointer sur l'endpoint Spring Boot
            `${API_SPRINGBOOT_URL}/periodes-ferie/${idJourFe}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression du dernier jour ferierr");
        }

        return true;
    },
    // create
    // Exemple avec Axios (dans votre fichier JourFerieService.js)
    // Exemple avec Axios en utilisant async/await
    create: async (data) => {
        const response = await fetch(
            `${API_SPRINGBOOT_URL}/periodes-ferie`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );
        if (!response.ok) {
            throw new Error("Erreur lors de la  create du dernier jour ferierr");
        }

        return true;
    },
    // update
    update: async (color_id, updated_fields) => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/periodes-ferie/${color_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated_fields), // on envoie tout l'objet
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour");
        }
        return response.json();
    }
}
export default JourFerieService;