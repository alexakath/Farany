import { useState, useEffect } from "react";
import SalariesService from "../../services/SalariesService";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";

function HistoSalairEmp() {
    const [payments, setPayments] = useState([]);       // La liste des paiements associés
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userid } = useParams();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const id = Number(userid);

                // Récupère tous les paiements du user (tous salaires confondus)
                const paymentsData = await SalariesService.getAllPaidByUserID(id);
                console.log("Paiment",paymentsData);
                setPayments(paymentsData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [userid]);

    if (loading) return <div>Chargement de l'historique...</div>;
    if (error) return <div>Erreur : {error}</div>;

    return (
        <div>
            <h1>HISTORIQUE DES PAIEMENTS</h1>

            <table>
                <thead>
                    <tr>
                        <th>Id Salaire</th>
                        <th>Montant</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((paiement) => (
                        <tr key={paiement.id}>
                            <td>{paiement.fk_salary}</td>
                            <td>{paiement.amount} €</td>
                            <td>{new Date(Number(paiement.datep) * 1000).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default HistoSalairEmp;