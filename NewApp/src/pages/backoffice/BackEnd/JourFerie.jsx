import JourFerieService from "../../../services/Backend/JourFerieService";
import { useState, useEffect } from "react";

function JourFerie() {
    const [jourferie, setJourFerie] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // États pour la GESTION DE LA CRÉATION (Ajout)
    const [createFormData, setCreateFormData] = useState({ nom: "", dateDebut: "", dateFin: "" });

    // États pour la gestion de l'édition (Update)
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({ nom: "", dateDebut: "", dateFin: "" });

    // Récupération des données
    const fetchJourFerie = async () => {
        try {
            setLoading(true);
            const jourfe = await JourFerieService.getAll();
            console.log("jour", jourfe);
            setJourFerie(jourfe);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJourFerie();
    }, []);

    // --- ACTION : SUPPRIMER ---
    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce jour férié ?")) {
            try {
                await JourFerieService.delete(id);
                setJourFerie(jourferie.filter((item) => item.id !== id));
            } catch (err) {
                alert("Erreur lors de la suppression : " + err.message);
            }
        }
    };

    // --- ACTION : ACTIVER LE MODE ÉDITION ---
    const handleEditClick = (jour) => {
        setEditingId(jour.id);
        setEditFormData({
            nom: jour.nom,
            dateDebut: jour.dateDebut,
            dateFin: jour.dateFin
        });
    };

    // Gérer les changements dans les inputs d'édition
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    // --- ACTION : SAUVEGARDER LA MODIFICATION ---
    const handleUpdateSubmit = async (id) => {
        try {
            const updatedData = await JourFerieService.update(id, editFormData);
            setJourFerie(jourferie.map((item) => (item.id === id ? updatedData : item)));
            setEditingId(null);
        } catch (err) {
            alert("Erreur lors de la modification : " + err.message);
        }
    };

    //GÉRER LES ENTRÉES DU FORMULAIRE DE CRÉATION ---
    const handleCreateFormChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData({ ...createFormData, [name]: value });
    };

    //ENREGISTRER UN NOUVEAU JOUR FÉRIÉ ---
    const handleCreateSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        try {
            // Appel au service (méthode .create)
            const newJourFerie = await JourFerieService.create(createFormData);

            // Ajoute le nouvel élément à la liste locale sans recharger
            setJourFerie([...jourferie, newJourFerie]);

            // Réinitialise le formulaire de création
            setCreateFormData({ nom: "", dateDebut: "", dateFin: "" });
        } catch (err) {
            alert("Erreur lors de la création : " + err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Erreur : {error}</div>;

    return (
        <div>
            <h1>Liste des Jours Fériés</h1>

            {/* --- FORMULAIRE D'AJOUT --- */}
            <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "5px" }}>
                <h3>Ajouter un jour férié / Période</h3>
                <form onSubmit={handleCreateSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                        type="text"
                        name="nom"
                        placeholder="Nom du jour férié"
                        value={createFormData.nom}
                        onChange={handleCreateFormChange}
                        required
                    />
                    <input
                        type="date"
                        name="dateDebut"
                        value={createFormData.dateDebut}
                        onChange={handleCreateFormChange}
                        required
                    />
                    <input
                        type="date"
                        name="dateFin"
                        value={createFormData.dateFin}
                        onChange={handleCreateFormChange}
                        required
                    />
                    <button type="submit" style={{ backgroundColor: "green", color: "white", padding: "5px 10px", border: "none", cursor: "pointer" }}>
                        Ajouter
                    </button>
                </form>
            </div>

            {/* --- TABLEAU --- */}
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Date début</th>
                        <th>Date Fin</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jourferie.map((jour) => (
                        <tr key={jour.id}>
                            {editingId === jour.id ? (
                                <>
                                    <td>
                                        <input type="text" name="nom" value={editFormData.nom} onChange={handleEditFormChange} />
                                    </td>
                                    <td>
                                        <input type="date" name="dateDebut" value={editFormData.dateDebut} onChange={handleEditFormChange} />
                                    </td>
                                    <td>
                                        <input type="date" name="dateFin" value={editFormData.dateFin} onChange={handleEditFormChange} />
                                    </td>
                                    <td>
                                        <button onClick={() => handleUpdateSubmit(jour.id)}>Enregistrer</button>
                                        <button onClick={() => setEditingId(null)}>Annuler</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{jour.nom}</td>
                                    <td>{jour.dateDebut}</td>
                                    <td>{jour.dateFin}</td>
                                    <td>
                                        <button onClick={() => handleEditClick(jour)} style={{ marginRight: "5px" }}>
                                            Modifier
                                        </button>
                                        <button onClick={() => handleDelete(jour.id)} style={{ color: "red" }}>
                                            Supprimer
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default JourFerie;