import { useState, useEffect } from 'react';
import DashboardService from '../../services/Dash/DashboardService';
import Card from '../Card';

const DashAmountMonth = () => {
    const [monthlyStats, setMonthlyStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMonthlyData = async () => {
            try {
                setLoading(true);
                // Appel de la fonction de somme par mois
                const data = await DashboardService.getAmountByMonth();
                console.log("data",data);
                setMonthlyStats(data);
            } catch (err) {
                console.error("Erreur lors de la récupération des données mensuelles:", err);
                setError("Impossible de charger les statistiques mensuelles.");
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
    }, []);

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <p className="text-gray-500 animate-pulse">Chargement des données mensuelles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <p className="text-red-500 font-semibold">{error}</p>
            </div>
        );
    }

    // Extraction des entrées pour l'affichage (Triées par clé chronologique optionnellement)
    const statsEntries = Object.entries(monthlyStats);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Masses Salariales par Mois</h2>

            {statsEntries.length === 0 ? (
                <p className="text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    Aucun paiement enregistré pour le moment.
                </p>
            ) : (
                <div className="space-y-6">
                    {/* Mode Grille de Cartes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {statsEntries.map(([mois, total]) => (
                            <div 
                                key={mois} 
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                {/* Formate le montant proprement (ex: 1 250,00) */}
                                <Card 
                                    title={mois.replace('-', ' ')} 
                                    description={`${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashAmountMonth;