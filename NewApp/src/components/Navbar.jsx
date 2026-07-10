import { Link, useLocation } from "react-router-dom";
import "../assets/component/Navbar.css";

function NavbarFront() {
  const location = useLocation();

  const navLinks = [
    { path: "/", icon: "AC", label: "Accueil" },
    { path: "/liste-userwdetail", icon: "EM", label: "Employes" },
    { path: "/liste-user", icon: "GS", label: "Generer Salaire" },
    { path: "/gen-salaire-alea", icon: "AL", label: "Salaire Alea" },
    { path: "/liste-salaire", icon: "LS", label: "Liste Salaires" },
    { path: "/gen-paiement", icon: "PM", label: "Paiement" },
    { path: "/create-salaire", icon: "CS", label: "Creer Salaire" },
  ];

  return (
    <nav className="navbar-front">
      <Link to="/" className="nav-logo">
        <span className="logo-icon">RH</span>
        <span>Gestion RH</span>
      </Link>

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
