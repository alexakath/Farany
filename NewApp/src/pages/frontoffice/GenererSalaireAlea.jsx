import UserService from "../../services/UserService";
import GenererSalAleaPopup from "../../components/GenererSalAleaPopup";
import SalariesService from "../../services/SalariesService";
import { useState, useEffect } from "react";
import "../../assets/page/ListeEmpGenerer.css";
import Navbar from "../../components/Navbar";
import PhotoBackService from "../../services/Backend/PhotoBackService";
import DocumentService from "../../services/DocumentService";

function GenererSalaireAlea() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [userPhotos, setUserPhotos] = useState({});
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [filters, setFilters] = useState({
        searchName: "",
        gender: "",
        job: "",
        minHours: "",
        maxHours: "",
    });

    const toUnixTimestamp = (dateStr) => {
        if (!dateStr) return null;
        const timestamp = Date.parse(dateStr);
        return !isNaN(timestamp) ? Math.floor(timestamp / 1000) : null;
    };
    

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await UserService.getAll();
                setUsers(usersData);

                try {
                    const photoData = await PhotoBackService.getAll();
                    if (photoData && photoData.length > 0) {
                        const photosMap = {};
                        for (const photo of photoData) {
                            const { userId, filename } = photo;
                            try {
                                const path = `${userId}/photos/thumbs/${filename}`;
                                const base64Image = await DocumentService.download("user", path);
                                if (base64Image) photosMap[userId] = base64Image;
                            } catch (downloadErr) {
                                console.warn(`Impossible de télécharger la photo pour le user ${userId}`, downloadErr);
                            }
                        }
                        setUserPhotos(photosMap);
                    }
                } catch (photoErr) {
                    console.warn("Erreur lors de la récupération des photos", photoErr);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const uniqueJobs = [...new Set(users.map((u) => u.job).filter(Boolean))].sort();

    const filteredUsers = users.filter((user) => {
        const matchesName = user.lastname
            ? user.lastname.toLowerCase().includes(filters.searchName.toLowerCase())
            : true;
        const matchesGender = filters.gender ? user.gender === filters.gender : true;
        const matchesJob = filters.job ? user.job === filters.job : true;
        const matchesHours =
            (filters.minHours ? Number(user.weeklyhours) >= Number(filters.minHours) : true) &&
            (filters.maxHours ? Number(user.weeklyhours) <= Number(filters.maxHours) : true);
        return matchesName && matchesGender && matchesJob && matchesHours;
    });

    // Génération : pour chaque user filtré on calcule le montant avec majoration
    // sur les jours fériés puis on crée le salaire (comme la génération existante).
    const handlePopupSubmit = async (formData) => {
        const filteredIds = filteredUsers.map((user) => user.id);

        const majorationWeekendRequise =
            (formData.travailleSamedi || formData.travailleDimanche) && !formData.pourcentageWeekend;

        if (
            filteredIds.length === 0 || !formData.salaireJour || !formData.pourcentage ||
            !formData.mois || !formData.annee || majorationWeekendRequise
        ) {
            setError("Veuillez remplir tous les champs et filtrer au moins un salarié.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const requests = filteredIds.map(async (id) => {
                // Calcul propre au user : jours non payés + majoration jour férié + weekend
                const calcul = await SalariesService.calculerSalaireAlea(
                    id,
                    formData.mois,
                    formData.annee,
                    formData.salaireJour,
                    formData.pourcentage,
                    formData.travailleSamedi,
                    formData.travailleDimanche,
                    formData.pourcentageWeekend
                );

                // Pas de jour à générer pour ce user ce mois-ci -> on saute
                if (calcul.nbTotal === 0) {
                    console.log(`User ${id} : aucun jour à générer pour ${formData.mois}/${formData.annee}`);
                    return null;
                }

                const dateDebut = calcul.missingDates[0];
                const dateFin = calcul.missingDates[calcul.nbTotal - 1];

                const label = `Période du ${dateDebut} au ${dateFin}` +
                    (calcul.nbFeries > 0 ? ` (${calcul.nbFeries} jour(s) férié(s) majoré(s))` : "") +
                    (calcul.nbWeekendMajores > 0 ? ` (${calcul.nbWeekendMajores} jour(s) weekend majoré(s))` : "");

                const salaryPayload = {
                    label,
                    fk_user: Number(id),
                    datesp: toUnixTimestamp(dateDebut),
                    dateep: toUnixTimestamp(dateFin),
                    datep: toUnixTimestamp(dateDebut),
                    salary: calcul.total,
                    amount: calcul.total,
                };

                console.log(`Payload user ${id} :`, salaryPayload, calcul);
                return SalariesService.create(salaryPayload);
            });

            const results = await Promise.all(requests);
            const crees = results.filter((r) => r !== null);
            setSuccess(true);
            console.log(`${crees.length} salaire(s) généré(s) avec succès.`, crees);
            setIsPopupOpen(false);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la génération.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const DEFAULT_AVATAR = "https://www.w3schools.com/howto/img_avatar.png";

    return (
        <div>
            <Navbar />
            <h1>Générer salaire Alea</h1>

            {/* FILTRES */}
            <div style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#272c68",
                borderRadius: "8px",
                flexWrap: "wrap",
            }}>
                <div>
                    <label>Nom : </label>
                    <input
                        type="text"
                        value={filters.searchName}
                        onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                    />
                </div>

                <div>
                    <label>Genre : </label>
                    <select
                        value={filters.gender}
                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    >
                        <option value="">Tous</option>
                        <option value="man">Homme</option>
                        <option value="woman">Femme</option>
                    </select>
                </div>

                <div>
                    <label>Poste : </label>
                    <select
                        value={filters.job}
                        onChange={(e) => setFilters({ ...filters, job: e.target.value })}
                    >
                        <option value="">Tous</option>
                        {uniqueJobs.map((job, index) => (
                            <option key={index} value={job}>{job}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Heures min : </label>
                    <input
                        type="number"
                        value={filters.minHours}
                        onChange={(e) => setFilters({ ...filters, minHours: e.target.value })}
                        style={{ width: "70px" }}
                    />
                </div>
                <div>
                    <label>Heures max : </label>
                    <input
                        type="number"
                        value={filters.maxHours}
                        onChange={(e) => setFilters({ ...filters, maxHours: e.target.value })}
                        style={{ width: "70px" }}
                    />
                </div>

                <button
                    onClick={() => setFilters({ searchName: "", gender: "", job: "", minHours: "", maxHours: "" })}
                >
                    Réinitialiser
                </button>

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
                        fontWeight: "bold",
                    }}
                >
                    Générer Salaire Alea ({filteredUsers.length})
                </button>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>Salaires générés avec succès !</p>}

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
                                    marginRight: "10px",
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

            <GenererSalAleaPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                onSubmit={handlePopupSubmit}
                userCount={filteredUsers.length}
            />
        </div>
    );
}

export default GenererSalaireAlea;
