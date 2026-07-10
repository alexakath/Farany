import { useState, useEffect } from 'react';
import DashboardSalService from '../../services/Dash/DashboardSalService';

const DashSalMonth = () => {
    const [monthlyStats, setMonthlyStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMonthlyData = async () => {
            try {
                setLoading(true);
                const data = await DashboardSalService.getSalaryAmountByMonth();
                setMonthlyStats(data);
            } catch (err) {
                console.error("Erreur lors de la recuperation des salaires mensuels:", err);
                setError("Impossible de charger les previsions salariales mensuelles.");
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
    }, []);

    const statsEntries = Object.entries(monthlyStats);
    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    if (loading) {
        return (
            <section className="dashboard-section">
                <h2 className="section-title">Salaire Prevue par Mois</h2>
                <p>Chargement des previsions mensuelles...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-section">
                <h2 className="section-title">Salaire Prevue par Mois</h2>
                <p className="dashboard-error">{error}</p>
            </section>
        );
    }

    return (
        <section className="dashboard-section">
            <h2 className="section-title">Salaire Prevue par Mois</h2>

            {statsEntries.length === 0 ? (
                <p>Aucun salaire de base enregistre pour le moment.</p>
            ) : (
                <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Mois</th>
                                <th>Montant prevu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsEntries.map(([mois, total]) => (
                                <tr key={mois}>
                                    <td>{mois.replace('-', ' ')}</td>
                                    <td className="amount-cell">{formatAmount(total)} EUR</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default DashSalMonth;
