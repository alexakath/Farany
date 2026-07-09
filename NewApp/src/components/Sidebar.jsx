// // Sidebar.jsx
// import { Link, useLocation } from "react-router-dom";
// import "../assets/component/Sidebar.css";
// function Sidebar() {
//   const location = useLocation();
  
//   const navItems = [
//     { path: "/", icon: "🏠", label: "Accueil" },
//     { path: "/dash", icon: "📊", label: "Dashboard" },
//     { path: "/dashsal", icon: "📊", label: "Dashboard Salaire" },
//     { path: "/reset", icon: "🔄", label: "Reset" },
//     { path: "/import", icon: "📥", label: "Import" },
//     { path: "/config", icon: "", label: "Configuration" },
//   ];

//   return (
//     <aside className="sidebar">
//       <div className="sidebar-brand">
//         <h2>
//           <span className="brand-icon">D</span>
//           <span className="brand-text">Dolibarr</span>
//           <span>ERP</span>
//         </h2>
//       </div>
      
//       <ul className="sidebar-nav">
//         <li className="nav-label">Menu Principal</li>
//         {navItems.map((item) => (
//           <li key={item.path}>
//             <Link 
//               to={item.path} 
//               className={location.pathname === item.path ? "active" : ""}
//             >
//               <span className="nav-icon">{item.icon}</span>
//               <span>{item.label}</span>
//             </Link>
//           </li>
//         ))}
//       </ul>
      
//       <div className="sidebar-footer">
//         <div className="user-info">
//           <div className="user-avatar">A</div>
//           <div>
//             <div className="user-name">Admin</div>
//             <div className="user-role">Administrateur</div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }

// export default Sidebar;

// NavbarFront.jsx
import { Link, useLocation } from "react-router-dom";
import "../assets/component/Navbar.css";
function Sidebar() {
  const location = useLocation();
  
  const navLinks = [
    { path: "/", icon: "🏠", label: "Accueil" },
    { path: "/dash", icon: "📊", label: "Dashboard" },
    { path: "/dashsal", icon: "📊", label: "Dashboard Alea" },
    { path: "/reset", icon: "🔄", label: "Reset" },
    { path: "/import", icon: "📥", label: "Import donnee" },
    { path: "/config", icon: "", label: "Parametre" },
  ];

  return (
    <nav className="navbar-front">
      <div className="nav-logo">
        <span className="logo-icon">◆</span>
        Gestion RH 2026
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

export default Sidebar;