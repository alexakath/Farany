import UserService from "../../services/UserService";
import { useState, useEffect } from "react";
import HistoPaidSalEmp from "./HistoPaidSalEmp";
import { Link, useParams } from "react-router-dom";
import PhotoBackService from "../../services/Backend/PhotoBackService"; // 1. Import du service de photo
import Navbar from "../../components/Navbar";
import DocumentService from "../../services/DocumentService";

function ListeEmpWDetail() {
    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("https://www.w3schools.com/howto/img_avatar.png"); // Avatar par défaut

    const { userid } = useParams();

    useEffect(() => {
        const fetchUserDataAndPhoto = async () => {
            try {
                setLoading(true);
                const id = Number(userid);

                // 1. Récupération des données de base de l'utilisateur
                const userData = await UserService.getById(id);
                setUsers(userData);
                // 2. Récupération de la photo directement depuis Dolibarr via son API
                try {
                    const photoData = await PhotoBackService.getByUserId(id);
                    if (photoData && photoData.length > 0) {
                        const filename = photoData[0].filename; 
                        const userId = photoData[0].userId;   
                        console.log("Chemin envoyé à Dolibarr :", `${userId}/photos/thumbs/${filename}`);
                        const base64Image = await DocumentService.download("user", `${userId}/photos/thumbs/${filename}`);
                        // const originalFilePath = `${userId}/photos/thumbs/${filename}`;

                        // Appel de la méthode download corrigée
                        // const base64Image = await DocumentService.download("user", originalFilePath);

                        if (base64Image) {
                            setAvatarUrl(base64Image); // React va recevoir "data:image/png;base64,iVBORw0KG..."
                        }
                    }
                } catch (photoErr) {
                    console.warn("Impossible de charger la photo Dolibarr, garde l'avatar par défaut", photoErr);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndPhoto();
    }, [userid]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Erreur : {error}</div>;
    if (!users) return <p>Aucun utilisateur trouvé.</p>;

    return (
        <div>
            <Navbar />
            <h1>Detail Employee</h1>

            {/* 4. Affichage de la photo dynamique avec gestion de l'erreur si le fichier n'existe plus sur XAMPP */}
            <img
                src={avatarUrl}
                alt="avatar"
                onError={(e) => {
                    // Si l'image XAMPP crash (404), on remet l'avatar par défaut
                    e.target.src = "https://www.w3schools.com/howto/img_avatar.png";
                }}
                style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover" // Évite que l'image soit déformée
                }}
            />
            <div>
                <strong>{users.lastname}</strong>
                <p>Ref: {users.ref_employee}</p>
                <p>Heures: {users.weeklyhours} h</p>
                <p>Genre: {users.gender}</p>
                <p>Poste: {users.job}</p>
            </div>
            <HistoPaidSalEmp />
        </div>
    );
}

export default ListeEmpWDetail;