const API_BASE = import.meta.env.VITE_DOLIBARR_URL;
const API_TOKEN = import.meta.env.VITE_DOLIBARR_TOKEN;

const headers = {
    "DOLAPIKEY": API_TOKEN,
    "Accept": "application/json",
    "Content-Type": "application/json"
};

const DocumentService = {
    // 1. LISTE DES DOCUMENTS
    getDocuments: async (modulepart) => {
        const response = await fetch(`${API_BASE}/documents?modulepart=${modulepart}`, {
            method: "GET",
            headers
        });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        return await response.json();
    },
    
    // 2. UPLOAD DE DOCUMENT
    upload: async (filename, modulepart, file_content, subdir = "") => {
        const payload = {
            filename: filename,
            modulepart: modulepart,
            filecontent: file_content, // Chaîne Base64 pure
            fileencoding: "base64",
            subdir: subdir
        };

        const response = await fetch(`${API_BASE}/documents/upload`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Erreur d'upload: ${await response.text()}`);
        return await response.json();
    },

    // 3. DOWNLOAD DE DOCUMENT (CORRIGÉ POUR LES IMAGES)
    download: async (modulepart, originalFile) => {
        // CORRECTION : Utilisation du paramètre correct "original_file" requis par l'API Dolibarr
        const response = await fetch(`${API_BASE}/documents/download?modulepart=${modulepart}&original_file=${originalFile}`, {
            method: "GET",
            headers
        });
        
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Erreur lors du téléchargement: ${response.status}`);
        }

        const data = await response.json();
        
        // Si le contenu est vide, on s'arrête là
        if (!data || !data.content) return null;

        // Détection du type mime (ex: image/png, image/jpeg)
        const mime = data["content-type"] || "image/png";

        // CORRECTION : On retourne une chaîne directement lisible par la balise <img src="..." />
        return `data:${mime};base64,${data.content}`;
    }
};

export default DocumentService;