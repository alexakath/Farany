import UserService from "../../services/UserService";
import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar";
import DocumentService from "../../services/DocumentService";
import PhotoBackService from "../../services/Backend/PhotoBackService";
import { Link } from "react-router-dom";
import '../../assets/component/ListeEMPDetail.css';

function getInitials(user) {
    const f = user.firstname?.[0] || "";
    const l = user.lastname?.[0] || "";
    return (f + l).toUpperCase() || "?";
}

function ListeEmpWDetail() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    // Structure cible : { "225": "data:image...", "228": "data:image..." }
    const [userPhotos, setUserPhotos] = useState({});
    const [brokenPhotos, setBrokenPhotos] = useState({});

    useEffect(() => {
        const fetchUsersAndPhotos = async () => {
            try {
                setLoading(true);

                // 1. Récupération de tous les utilisateurs
                const usersData = await UserService.getAll();
                setUsers(usersData);

                // 2. Récupération de toutes les métadonnées de photos depuis SQLite
                try {
                    const photoData = await PhotoBackService.getAll();

                    if (photoData && photoData.length > 0) {
                        const photosMap = {};

                        for (const photo of photoData) {
                            const { userId, filename } = photo;

                            try {
                                const path = `${userId}/photos/thumbs/${filename}`;
                                const base64Image = await DocumentService.download("user", path);

                                if (base64Image) {
                                    photosMap[userId] = base64Image;
                                }
                            } catch (downloadErr) {
                                console.warn(`Impossible de télécharger la photo pour le user ${userId}`, downloadErr);
                            }
                        }

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

        fetchUsersAndPhotos();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase().includes(q)
        );
    }, [users, search]);

   if (loading) return <div>Loading...</div>;

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="emp-page">
                    <div className="emp-error">
                        <strong>Impossible de charger la liste des utilisateurs.</strong>
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="emp-page">
                <div className="emp-header">
                    <h1>Employees</h1>
                </div>
                {filteredUsers.length === 0 ? (
                    <div className="emp-empty">
                        <p>Aucun utilisateur ne correspond à votre recherche.</p>
                    </div>
                ) : (
                    <ul className="emp-grid">
                        {filteredUsers.map((user) => {
                            const photo = userPhotos[user.id];
                            const showPhoto = photo && !brokenPhotos[user.id];

                            return (
                                <li className="emp-card" key={user.id}>
                                    <Link to={`/detail-emp/${user.id}`} className="emp-card-link">
                                        {showPhoto ? (
                                            <img
                                                src={photo}
                                                alt={`avatar-${user.lastname}`}
                                                className="emp-avatar emp-avatar--photo"
                                                onError={() =>
                                                    setBrokenPhotos((prev) => ({ ...prev, [user.id]: true }))
                                                }
                                            />
                                        ) : (
                                            <div className="emp-avatar emp-avatar--initials">
                                                {getInitials(user)}
                                            </div>
                                        )}
                                        <div className="emp-info">
                                            <strong className="emp-name">
                                                {user.firstname ? `${user.firstname} ` : ""}
                                                {user.lastname}
                                            </strong>
                                            {user.role && <span className="emp-role">{user.role}</span>}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ListeEmpWDetail;