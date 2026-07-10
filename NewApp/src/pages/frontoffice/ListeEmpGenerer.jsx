import UserService from "../../services/UserService";
import GenerateSalairePopup from "../../components/GenerateSalairePopup";
import SalariesService from "../../services/SalariesService";
import { useState, useEffect } from "react";
import "../../assets/page/ListeEmpGenerer.css";
import Navbar from "../../components/Navbar";
import PhotoBackService from "../../services/Backend/PhotoBackService";
import DocumentService from "../../services/DocumentService";

function ListeEmpGenerer() {
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
        maxHours: ""
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
                    console.warn("Erreur lors de la recuperation des donnees photos SQLite", photoErr);
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

        if (filteredIds.length === 0 || !formData.montant || !formData.dateDebut || !formData.dateFin) {
            setError("Veuillez remplir tous les champs obligatoires et filtrer au moins un salarie.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const requests = filteredIds.map(async (id) => {
                const salaryPayload = {
                    label: `Periode du ${formData.dateDebut} au ${formData.dateFin}`,
                    fk_user: Number(id),
                    datesp: toUnixTimestamp(formData.dateDebut),
                    dateep: toUnixTimestamp(formData.dateFin),
                    datep: toUnixTimestamp(formData.dateDebut),
                    salary: Number(formData.montant),
                    amount: Number(formData.montant),
                };

                return SalariesService.create(salaryPayload);
            });

            await Promise.all(requests);
            setSuccess(true);
            setIsPopupOpen(false);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la creation.");
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
                <h1>Generer salaire</h1>
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
                        {uniqueJobs.map((job) => (
                            <option key={job} value={job}>{job}</option>
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
                        Generer Salaire ({filteredUsers.length})
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
