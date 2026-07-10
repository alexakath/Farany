import { useState, useEffect } from 'react';
import DashboardSalService from '../../services/Dash/DashboardSalService';

const DashSalGender = () => {
    const [stats, setStats] = useState({ homme: 0, femme: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const totalHomme = await DashboardSalService.getTotalSalaryAmountByGender('man');
                const totalFemme = await DashboardSalService.getTotalSalaryAmountByGender('woman');

                setStats({
                    homme: totalHomme,
                    femme: totalFemme
                });
            } catch (err) {
                console.error("Erreur lors de la recuperation des salaires:", err);
                setError("Impossible de charger le budget des salaires.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    if (loading) {
        return (
            <section className="dashboard-section">
                <h2 className="section-title">Salaire par Genre</h2>
                <p>Chargement du budget des salaires...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-section">
                <h2 className="section-title">Salaire par Genre</h2>
                <p className="dashboard-error">{error}</p>
            </section>
        );
    }

    const rows = [
        { label: "Total salaires", amount: stats.homme + stats.femme },
        { label: "Homme", amount: stats.homme },
        { label: "Femme", amount: stats.femme }
    ];

    return (
        <section className="dashboard-section">
            <h2 className="section-title">Salaire par Genre</h2>
            <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Genre</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label}>
                                <td>{row.label}</td>
                                <td className="amount-cell">{formatAmount(row.amount)} EUR</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default DashSalGender;
