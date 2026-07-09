import UserService from "../../services/UserService";
import GenerateSalairePopup from "../../components/GenerateSalairePopup";
import SalariesService from "../../services/SalariesService";
import { useState, useEffect } from "react";
import "../../assets/page/ListeEmpGenerer.css";
import Navbar from "../../components/Navbar";
import PhotoBackService from "../../services/Backend/PhotoBackService"; // 1. Import du service de photo
import DocumentService from "../../services/DocumentService";

function ListeEmpGenerer() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(true);
    const [emphoto, setEmphoto] = useState({});
    const [userPhotos, setUserPhotos] = useState({});

    const toUnixTimestamp = (dateStr) => {
        if (!dateStr) return null;
        const timestamp = Date.parse(dateStr);
        return !isNaN(timestamp) ? Math.floor(timestamp / 1000) : null;
    };


    //  ouvrir/fermer le popup
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [filters, setFilters] = useState({
        searchName: "",
        gender: "",
        job: "",
        minHours: "",
        maxHours: ""

    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await UserService.getAll();
                setUsers(usersData);
                setLoading(false);

                try {
                    const photoData = await PhotoBackService.getAll();

                    if (photoData && photoData.length > 0) {
                        const photosMap = {};

                        // Boucle asynchrone pour télécharger l'image de chaque employé trouvé
                        for (const photo of photoData) {
                            const { userId, filename } = photo;

                            try {
                                const path = `${userId}/photos/thumbs/${filename}`;
                                const base64Image = await DocumentService.download("user", path);

                                if (base64Image) {
                                    // Associe l'image en Base64 à l'ID de son utilisateur
                                    photosMap[userId] = base64Image;
                                }
                            } catch (downloadErr) {
                                console.warn(`Impossible de télécharger la photo pour le user ${userId}`, downloadErr);
                            }
                        }

                        // Met à jour l'état avec l'ensemble des photos récupérées
                        setUserPhotos(photosMap);
                    }
                } catch (photoErr) {
                    console.warn("Erreur lors de la récupération des données photos SQLite", photoErr);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // LISTE UNIQUE DES POSTES (SANS DOUBLONS)
    const uniqueJobs = [...new Set(users.map(u => u.job).filter(Boolean))].sort();

    // FILTRAGE
    const filteredUsers = users.filter((user) => {
        const matchesName = user.lastname
            ? user.lastname.toLowerCase().includes(filters.searchName.toLowerCase())
            : true;

        const matchesGender = filters.gender
            ? user.gender === filters.gender
            : true;

        const matchesJob = filters.job
            ? user.job === filters.job
            : true;

        const matchesHours =
            (filters.minHours ? Number(user.weeklyhours) >= Number(filters.minHours) : true) &&
            (filters.maxHours ? Number(user.weeklyhours) <= Number(filters.maxHours) : true);
        return matchesName && matchesGender && matchesJob && matchesHours;
    });

    // donnee recu via popup
    const handlePopupSubmit = async (formData) => {
        // maka ny id user amle filtre azo
        const filteredIds = filteredUsers.map(user => user.id);
        console.log("IDs des utilisateurs filtrés :", filteredIds);
        console.log("Données du formulaire reçues :", formData);

        // 
        if (filteredIds.length === 0 || !formData.montant || !formData.dateDebut || !formData.dateFin) {
            setError("Veuillez remplir tous les champs obligatoires et filtrer au moins un salarié.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // On crée une liste de promesses, une pour chaque utilisateur filtré
            const requests = filteredIds.map(async (id) => {
                const salaryPayload = {
                    label: `Période du ${formData.dateDebut} au ${formData.dateFin}`,
                    fk_user: Number(id),
                    datesp: toUnixTimestamp(formData.dateDebut),
                    dateep: toUnixTimestamp(formData.dateFin),
                    datep: toUnixTimestamp(formData.dateDebut),
                    salary: Number(formData.montant),
                    amount: Number(formData.montant),
                };

                console.log(`Envoi du payload pour l'user ${id} :`, salaryPayload);
                return SalariesService.create(salaryPayload);
            });

            //exécute
            const results = await Promise.all(requests);
            setSuccess(true);
            console.log("Tous les salaires ont été créés avec succès !", results);
            setIsPopupOpen(false);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const DEFAULT_AVATAR = "https://www.w3schools.com/howto/img_avatar.png";
    const currentAvatar = userPhotos[emphoto.id] || DEFAULT_AVATAR;

    return (
        <div>
            <Navbar />
            <h1>Liste des utilisateurs</h1>

            {/* FILTRES */}
            <div style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#272c68",
                borderRadius: "8px"
            }}>

                {/* NOM */}
                <div>
                    <label>Nom : </label>
                    <input
                        type="text"
                        value={filters.searchName}
                        onChange={(e) =>
                            setFilters({ ...filters, searchName: e.target.value })
                        }
                    />
                </div>

                {/* GENRE */}
                <div>
                    <label>Genre : </label>
                    <select
                        value={filters.gender}
                        onChange={(e) =>
                            setFilters({ ...filters, gender: e.target.value })
                        }
                    >
                        <option value="">Tous</option>
                        <option value="man">Homme</option>
                        <option value="woman">Femme</option>
                    </select>
                </div>

                {/* POSTE */}
                <div>
                    <label>Poste : </label>
                    <select
                        value={filters.job}
                        onChange={(e) =>
                            setFilters({ ...filters, job: e.target.value })
                        }
                    >
                        <option value="">Tous</option>

                        {uniqueJobs.map((job, index) => (
                            <option key={index} value={job}>
                                {job}
                            </option>
                        ))}
                    </select>
                </div>

                {/* HEURES */}
                <div>
                    <label>Heures min : </label>
                    <input
                        type="number"
                        value={filters.minHours}
                        onChange={(e) =>
                            setFilters({ ...filters, minHours: e.target.value })
                        }
                        style={{ width: "70px" }}
                    />
                </div>
                <div>
                    <label>Heures max : </label>
                    <input
                        type="number"
                        value={filters.maxHours}
                        onChange={(e) =>
                            setFilters({ ...filters, maxHours: e.target.value })
                        }
                        style={{ width: "70px" }}
                    />
                </div>

                {/* RESET */}
                <button
                    onClick={() =>
                        setFilters({
                            searchName: "",
                            gender: "",
                            job: "",
                            minHours: ""
                        })
                    }
                >
                    Réinitialiser
                </button>

                {/* BOUTON GENRER */}
                <button
                    onClick={() => setIsPopupOpen(true)}
                    disabled={filteredUsers.length === 0}
                    style={{
                        backgroundColor: filteredUsers.length === 0 ? "#ccc" : "#4CAF50",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: filteredUsers.length === 0 ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Generer  Salaire ({filteredUsers.length})
                </button>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* LISTE */}
            {filteredUsers.length === 0 ? (
                <p>Aucun utilisateur trouvé.</p>
            ) : (
                <ul>
                    {filteredUsers.map((user) => (
                        <li key={user.id} style={{ marginBottom: "15px", listStyle: "none" }}>
                            <img
                                src={userPhotos[user.id] || DEFAULT_AVATAR}
                                alt="avatar"
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    marginRight: "10px"
                                }}
                            />

                            <div style={{ display: "inline-block" }}>
                                <strong>{user.lastname}</strong>
                                <p>Ref: {user.ref_employee}</p>
                                <p>Heures: {user.weeklyhours} h</p>
                                <p>Genre: {user.gender}</p>
                                <p>Poste: {user.job}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {/*UTILISATION DU COMPOSANT POPUP */}
            <GenerateSalairePopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                onSubmit={handlePopupSubmit}
                userCount={filteredUsers.length}
            />
        </div>
    );
}

export default ListeEmpGenerer;