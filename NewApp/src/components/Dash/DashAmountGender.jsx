import { useState, useEffect } from 'react';
import DashboardService from '../../services/Dash/DashboardService';
import Card from '../Card';

const DashAmountGender = () => {
    const [stats, setStats] = useState({ homme: 0, femme: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const totalHomme = await DashboardService.getTotalAmountByGender('man');
                const totalFemme = await DashboardService.getTotalAmountByGender('woman');
                
                // Mise à jour de l'état
                setStats({
                    homme: totalHomme,
                    femme: totalFemme
                });

            } catch (err) {
                console.error("Erreur lors de la récupération des données:", err);
                setError("Impossible de charger les données du tableau de bord.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Pour voir la modification de l'état UNIQUEMENT quand il change vraiment :
    useEffect(() => {
        if (!loading) {
            console.log("Stats mis à jour à l'écran :", stats);
        }
    }, [stats, loading]);

    if (loading) return <div><p>Chargement du tableau de bord...</p></div>;
    if (error) return <div><p>{error}</p></div>;

    const totalGlobal = stats.homme + stats.femme;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Tableau de Bord</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="TOTAL" description={totalGlobal} />
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="HOMME" description={stats.homme} />
                </div>
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="FEMME" description={stats.femme} />
                </div>
            </div>
        </div>
    );
};

export default DashAmountGender;