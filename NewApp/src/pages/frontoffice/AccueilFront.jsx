import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";

const actions = [
    {
        to: "/liste-userwdetail",
        title: "Liste des employés",
        description: "Consulter et gérer la liste complète des employés.",
        icon: "👥",
    },
    {
        to: "/liste-user",
        title: "Générer un salaire",
        description: "Choisir un employé pour générer sa fiche de salaire.",
        icon: "🧾",
    },
    {
        to: "/liste-salaire",
        title: "Liste des salaires",
        description: "Voir l'historique de tous les salaires générés.",
        icon: "📋",
    },
    {
        to: "/create-salaire",
        title: "Créer un salaire",
        description: "Ajouter manuellement un nouveau bulletin de salaire.",
        icon: "➕",
    },
    {
        to: "/gen-salaire-alea",
        title: "Générer Par jours Salaire",
        description: "Ajouter manuellement un nouveau bulletin de salaire.",
        icon: "💰",
    },

];

function Accueil() {
    return (
        <div>
            <Navbar />

            <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
                <h1>SERVICE DISPONIBLE</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "-16px", marginBottom: "28px" }}>
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                    }}
                >
                    {actions.map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            className="card"
                            style={{ textDecoration: "none", display: "block" }}
                        >
                            <div style={{ fontSize: "28px", marginBottom: "12px" }}>{action.icon}</div>
                            <h3 style={{ color: "var(--text-primary)" }}>{action.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                                {action.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default Accueil;