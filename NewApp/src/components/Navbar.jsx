// NavbarFront.jsx
import { Link, useLocation } from "react-router-dom";
import "../assets/component/Navbar.css";
function NavbarFront() {
  const location = useLocation();
  
  const navLinks = [
    { path: "/", icon: "🏠", label: "Accueil" },
    { path: "/liste-userwdetail", icon: "👥", label: "Liste Employés" },
    { path: "/liste-user", icon: "💰", label: "Générer Salaire" },
    // { path: "/liste-user-genjour", icon: "💰", label: "Générer Par jours Salaire" },
    { path: "/gen-salaire-alea", icon: "🎲", label: "Générer Salaire Alea" },
    { path: "/liste-salaire", icon: "📋", label: "Liste Salaires" },
    { path: "/gen-paiement", icon: "📋", label: "Generer paiement" },
    { path: "/create-salaire", icon: "➕", label: "Créer Salaire" },
  ];

  return (
    <nav className="navbar-front">
      <div className="nav-logo">
        <span className="logo-icon">◆</span>
        Gestion RH 2026 2026
      </div>
      
      <ul className="nav-links">
        {navLinks.map((link) => (
          <li key={link.path}>
            <Link 
              to={link.path}
              className={location.pathname === link.path ? "active" : ""}
            >
              <span className="link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavbarFront;