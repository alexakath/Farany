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

    const resetFilters = () => {
        setFilters({ searchName: "", gender: "", job: "", minHours: "", maxHours: "" });
    };

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
                                console.warn(`Impossible de telecharger la photo pour le user ${userId}`, downloadErr);
                            }
                        }
                        setUserPhotos(photosMap);
                    }
                } catch (photoErr) {
                    console.warn("Erreur lors de la recuperation des photos", photoErr);
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

    const handlePopupSubmit = async (formData) => {
        const filteredIds = filteredUsers.map((user) => user.id);

        const majorationWeekendRequise =
            (formData.travailleSamedi || formData.travailleDimanche) && !formData.pourcentageWeekend;

        if (
            filteredIds.length === 0 || !formData.salaireJour || !formData.pourcentage ||
            !formData.mois || !formData.annee || majorationWeekendRequise
        ) {
            setError("Veuillez remplir tous les champs et filtrer au moins un salarie.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const requests = filteredIds.map(async (id) => {
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

                if (calcul.nbTotal === 0) {
                    console.log(`User ${id} : aucun jour a generer pour ${formData.mois}/${formData.annee}`);
                    return null;
                }

                const dateDebut = calcul.missingDates[0];
                const dateFin = calcul.missingDates[calcul.nbTotal - 1];

                const label = `Periode du ${dateDebut} au ${dateFin}` +
                    (calcul.nbFeries > 0 ? ` (${calcul.nbFeries} jour(s) ferie(s) majore(s))` : "") +
                    (calcul.nbWeekendMajores > 0 ? ` (${calcul.nbWeekendMajores} jour(s) weekend majore(s))` : "");

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
            console.log(`${crees.length} salaire(s) genere(s) avec succes.`, crees);
            setIsPopupOpen(false);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la generation.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const DEFAULT_AVATAR = "https://www.w3schools.com/howto/img_avatar.png";

    return (
        <div className="liste-emp-generer">
            <Navbar />

            <div className="page-header">
                <h1>Generer salaire Alea</h1>
            </div>

            <div className="filters-bar">
                <div className="filter-group filter-group-wide">
                    <label>Nom</label>
                    <input
                        type="text"
                        placeholder="Rechercher un nom"
                        value={filters.searchName}
                        onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                    />
                </div>

                <div className="filter-group">
                    <label>Genre</label>
                    <select
                        value={filters.gender}
                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    >
                        <option value="">Tous</option>
                        <option value="man">Homme</option>
                        <option value="woman">Femme</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Poste</label>
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

                <div className="filter-group filter-group-small">
                    <label>Heures min</label>
                    <input
                        type="number"
                        min="0"
                        value={filters.minHours}
                        onChange={(e) => setFilters({ ...filters, minHours: e.target.value })}
                    />
                </div>

                <div className="filter-group filter-group-small">
                    <label>Heures max</label>
                    <input
                        type="number"
                        min="0"
                        value={filters.maxHours}
                        onChange={(e) => setFilters({ ...filters, maxHours: e.target.value })}
                    />
                </div>

                <div className="filter-actions">
                    <button type="button" className="btn-reset-filters" onClick={resetFilters}>
                        Reinitialiser
                    </button>

                    <button
                        type="button"
                        className="btn-generate"
                        onClick={() => setIsPopupOpen(true)}
                        disabled={filteredUsers.length === 0}
                    >
                        Generer Salaire Alea ({filteredUsers.length})
                    </button>
                </div>
            </div>

            {error && <p className="message-error">{error}</p>}
            {success && <p className="message-success">Salaires generes avec succes !</p>}

            {filteredUsers.length === 0 ? (
                <div className="empty-state">
                    <h3>Aucun utilisateur trouve.</h3>
                </div>
            ) : (
                <div className="user-grid">
                    {filteredUsers.map((user) => (
                        <article key={user.id} className="user-card">
                            <img
                                src={userPhotos[user.id] || DEFAULT_AVATAR}
                                alt="avatar"
                                className="user-avatar"
                            />
                            <div className="user-info">
                                <div className="user-name">{user.lastname}</div>
                                <div className="user-detail">
                                    <span><span className="label">Ref:</span> {user.ref_employee}</span>
                                    <span><span className="label">Heures:</span> {user.weeklyhours} h</span>
                                </div>
                                <div className="user-detail">
                                    <span><span className="label">Genre:</span> {user.gender}</span>
                                    <span><span className="label">Poste:</span> {user.job}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
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
