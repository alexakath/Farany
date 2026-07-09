import { useState, useEffect } from "react";
import SalariesService from "../../services/SalariesService";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";

function HistoSalairEmp() {
    // 1. On initialise avec un tableau vide [] au lieu de null
    const [salariesHistory, setSalariesHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userid } = useParams();
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString("fr-FR");
    };

    useEffect(() => {
        const fetchSalaries = async () => {
            try {
                // const id = Number(userid);
                console.log("useiid :", userid);
                const data = await SalariesService.getByUserID(userid);
                
                console.log("sal",data);
                // On s'assure de stocker un tableau (si l'API renvoie directement le tableau)
                setSalariesHistory(Array.isArray(data) ? data : [data]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSalaries();
    }, [userid]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error}</div>;
    if (salariesHistory.length === 0) return <p>Aucun historique de salaire trouvé.</p>;

    // 2. On récupère les infos globales de l'employé depuis le premier élément si dispo
    const employeeInfo = salariesHistory[0];

    return (
        <div>
            <Navbar />
            <h1>HISTORIQUE SALAIRE</h1>
            {employeeInfo && (
                <div style={{ marginBottom: "20px" }}>
                    <strong>{employeeInfo.lastname}</strong>
                </div>
            )}

            {/* 3. On boucle sur le tableau pour afficher TOUS les salaires */}
            <div className="historique-liste">
                {salariesHistory.map((salaire, index) => (
                    <div key={index} style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}>
                        <p>ID:  {salaire.id}</p>
                        <p><strong>Période :</strong> du {formatDate(salaire.datesp)} au {formatDate(salaire.dateep)}</p>
                        <p>Montant: {salaire.amount}</p>
                        <p>Label: {salaire.label}</p>
                        
                    </div>
                ))}
            </div>
        </div>
    );
}

export default HistoSalairEmp;