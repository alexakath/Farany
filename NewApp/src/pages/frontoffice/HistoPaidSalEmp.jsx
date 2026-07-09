import { useState, useEffect } from "react";
import SalariesService from "../../services/SalariesService";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";

function HistoPaidSalEmp() {
    const [payments, setPayments] = useState([]);
    const [salariesHistory, setSalariesHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { userid } = useParams();

    const formatDate = (timestamp) => {
        if (!timestamp) return "-";
        return new Date(Number(timestamp) * 1000).toLocaleDateString("fr-FR");
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const id = Number(userid);

                // Historique des salaires
                const salaries = await SalariesService.getByUserID(id);

                // Historique des paiements
                const paymentsData = await SalariesService.getAllPaidByUserID(id);

                setSalariesHistory(Array.isArray(salaries) ? salaries : [salaries]);
                setPayments(Array.isArray(paymentsData) ? paymentsData : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [userid]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error}</div>;

    return (
        <div>
            <h1>Historique des salaires et paiements</h1>

            <table border="1">
                <thead>
                    <tr>
                        <th>Référence</th>
                        <th>Montant salaire</th>
                        <th>Période</th>
                        <th>Montant payé</th>
                        <th>Date paiement</th>
                        <th>Reste</th>
                    </tr>
                </thead>

                <tbody>
                    {salariesHistory.map((salary) => {

                        // Paiements correspondant à ce salaire
                        const salaryPayments = payments.filter(
                            payment => Number(payment.fk_salary) === Number(salary.id)
                        );

                        // Total payé
                        const totalPaid = salaryPayments.reduce(
                            (sum, payment) => sum + Number(payment.amount),
                            0
                        );

                        // Utilisation de ta fonction
                        const reste = SalariesService.getRestPaid(
                            salary.amount,
                            totalPaid
                        );

                        // Aucun paiement
                        if (salaryPayments.length === 0) {
                            return (
                                <tr key={salary.id}>
                                    <td>{salary.ref}</td>
                                    <td>{salary.amount} €</td>
                                    <td>
                                        {formatDate(salary.datesp)} au {formatDate(salary.dateep)}
                                    </td>
                                    <td>Aucun paiement</td>
                                    <td>-</td>
                                    <td>{reste} €</td>
                                </tr>
                            );
                        }

                        // Un ou plusieurs paiements
                        return salaryPayments.map((payment, index) => (
                            <tr key={payment.id}>
                                {index === 0 && (
                                    <>
                                        <td rowSpan={salaryPayments.length}>
                                            {salary.ref}
                                        </td>

                                        <td rowSpan={salaryPayments.length}>
                                            {salary.amount} €
                                        </td>

                                        <td rowSpan={salaryPayments.length}>
                                            {formatDate(salary.datesp)} au {formatDate(salary.dateep)}
                                        </td>
                                    </>
                                )}
                                <td>{payment.amount} €</td>

                                <td>{formatDate(payment.datep)}</td>

                                {index === 0 && (
                                    <td rowSpan={salaryPayments.length}>
                                        {reste} €
                                    </td>
                                )}
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default HistoPaidSalEmp;