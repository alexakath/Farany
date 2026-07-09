import { Link } from "react-router-dom";

function Accueil() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
        >
            <div style={{ textAlign: "center", maxWidth: "560px" }}>
                <h1 style={{ justifyContent: "center" }}>Choisissez votre espace</h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
                    Sélectionnez l'interface à laquelle vous souhaitez accéder.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                    }}
                >
                    <Link
                        to="/login-admin"
                        className="card"
                        style={{ textDecoration: "none", padding: "32px 20px" }}
                    >
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔐</div>
                        <h3 style={{ color: "var(--text-primary)", marginBottom: "4px" }}>Back office</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                            Administration et gestion
                        </p>
                    </Link>

                    <Link
                        to="/accueil-front"
                        className="card"
                        style={{ textDecoration: "none", padding: "32px 20px" }}
                    >
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🖥️</div>
                        <h3 style={{ color: "var(--text-primary)", marginBottom: "4px" }}>Front office</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                            Espace utilisateur public
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Accueil;