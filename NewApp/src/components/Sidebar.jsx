import { Link, useLocation } from "react-router-dom";
import "../assets/component/Sidebar.css";

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "AC", label: "Accueil" },
    { path: "/dash", icon: "DB", label: "Dashboard Paiement" },
    { path: "/dashsal", icon: "SA", label: "Dashboard Salaire" },
    { path: "/reset", icon: "RE", label: "Reset" },
    { path: "/import", icon: "IM", label: "Import Donnees" },
    { path: "/config", icon: "CF", label: "Parametres" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>
          <span className="brand-icon">RH</span>
          <span className="brand-text">Gestion RH</span>
          <span className="brand-badge">Admin</span>
        </h2>
      </div>

      <ul className="sidebar-nav">
        <li className="nav-label">Backoffice</li>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">A</div>
          <div>
            <div className="user-name">Admin</div>
            <div className="user-role">Administrateur</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
