const API_SPRINGBOOT_URL = import.meta.env.VITE_GLPI_SPRINGBOOT_URL;

const PhotoBackService = {
    
    // Récupérer toutes les images
    getAll: async () => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/user-images`);
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération de toutes les images");
        }
        return response.json();
    },

    // Récupérer les images d'un utilisateur par son ID
    getByUserId: async (userId) => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/user-images/user/${userId}`);
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des images de l'utilisateur ${userId}`);
        }
        return response.json();
    },

    // Ajouter l'enregistrement d'une nouvelle image
    // updated_fields doit contenir : { userId: X, filename: "nom_image.png" }
    create: async (image_data) => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/user-images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(image_data),
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'enregistrement de l'image");
        }
        return response.json();
    },

    // Supprimer une image par son ID unique
    delete: async (id) => {
        const response = await fetch(`${API_SPRINGBOOT_URL}/user-images/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression de l'image");
        }

        return true;
    },
    // 
    
};

export default PhotoBackService;