import Sidebar from "../../components/Sidebar";
import { Link } from "react-router-dom";

function Accueil() {
    return (
        <div style={{ display: "flex" }}>
            <Sidebar />

            <main style={{ flex: 1, padding: "40px" }}>
                <div
                    className="container"
                    style={{
                        maxWidth: "440px",
                        margin: "80px auto",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "14px",
                            background: "var(--primary)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            fontWeight: 700,
                            margin: "0 auto 20px",
                        }}
                    >
                        A
                    </div>

                    <h2 style={{ marginBottom: "8px" }}>Espace administration</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "28px" }}>
                        Connectez-vous pour accéder à votre tableau de bord.
                    </p>

                    <Link to="/" className="btn btn-primary" style={{ width: "100%" }}>
                        Deconnecter
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default Accueil;