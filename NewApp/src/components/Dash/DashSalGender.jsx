import { useState, useEffect } from 'react';
// Importation du nouveau service de salaires attendus
import DashboardSalService from '../../services/Dash/DashboardSalService';
import Card from '../Card';

const DashSalGender = () => {
    const [stats, setStats] = useState({ homme: 0, femme: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Appel des nouvelles fonctions basées sur le montant des salaires de base
                const totalHomme = await DashboardSalService.getTotalSalaryAmountByGender('man');
                const totalFemme = await DashboardSalService.getTotalSalaryAmountByGender('woman');
                
                setStats({
                    homme: totalHomme,
                    femme: totalFemme
                });

            } catch (err) {
                console.error("Erreur lors de la récupération des salaires:", err);
                setError("Impossible de charger le budget des salaires.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div><p>Chargement du budget des salaires...</p></div>;
    if (error) return <div><p>{error}</p></div>;

    const totalGlobal = stats.homme + stats.femme;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">* * * Salaire par Genre * * * </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="TOTAL SALAIRES" description={`${totalGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} />
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="HOMME" description={`${stats.homme.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} />
                </div>
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <Card title="FEMME" description={`${stats.femme.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} />
                </div>
            </div>
        </div>
    );
};

export default DashSalGender;