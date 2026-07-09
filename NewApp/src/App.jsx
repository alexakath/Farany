import { BrowserRouter, Routes, Route } from "react-router-dom";

// import
import ImportPage from "./pages/backoffice/Import";
//  reset 
import Reset from "./pages/backoffice/Reset";


// login
import LoginAdmin from "./components/LoginAdmin";


// Liste
import ListeEmpGenerer from "./pages/frontoffice/ListeEmpGenerer";
import ListeSalaire from "./pages/frontoffice/ListeSalaire";
import ListeEmpWDetail from "./pages/frontoffice/ListeEmpWDetail";

// accueil 
import Accueil from "./pages/Accueil";
import AccueilBack from "./pages/backoffice/AccueilBack";
import AccueilFront from "./pages/frontoffice/AccueilFront";

// detail  EMP 
import DetailEmp from "./pages/frontoffice/DetailEmp";
import HistoSalairEmp from "./pages/frontoffice/HistoSalairEmp";
// import HistoPaidEmp from "./pages/frontoffice/HistoPaidEmp";
import HistoPaidSalEmp from "./pages/frontoffice/HistoPaidSalEmp";

// salaire
import CreateSalaire from "./pages/frontoffice/CreateSalaire";
import PaidSalaire from "./pages/frontoffice/PaidSalaire";

// dash
import Dashboard from "./pages/backoffice/Dashboard";
import DashboardSal from "./pages/backoffice/DashboardSal";

// config 
import ConfigBack  from "./pages/backoffice/ConfigBack";

//  
import GenererSalJourPopup from "./components/GenererSalJourPopup";
import ListeSalGenJour from "./pages/frontoffice/ListeSalGenJour";
import GenererPaiement from "./pages/frontoffice/GenererPaiement";
import GenererSalaireAlea from "./pages/frontoffice/GenererSalaireAlea";
// import DashAmountGender from "./components/Dash/DashAmountGender";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/accueil-back" element={<AccueilBack />} />
        <Route path="/accueil-front" element={<AccueilFront />} />
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/dashsal" element={<DashboardSal />} />

        <Route path="/import" element={<ImportPage />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/login-admin" element={<LoginAdmin />} />

        <Route path="/genssalairejour" element={<GenererSalJourPopup />} />
        <Route path="/liste-user-genjour" element={<ListeSalGenJour />} />
        <Route path="/gen-salaire-alea" element={<GenererSalaireAlea />} />
        <Route path="/gen-paiement" element={<GenererPaiement />} />


        <Route path="/config" element={<ConfigBack />} />
        <Route path="/liste-user" element={<ListeEmpGenerer />} />
        <Route path="/liste-userwdetail" element={<ListeEmpWDetail />} />
        <Route path="/liste-salaire" element={<ListeSalaire />} />
        <Route path="/detail-emp/:userid" element={<DetailEmp />} />
        <Route path="/histosal-emp/:userid" element={<HistoSalairEmp />} />
        {/* <Route path="/histosal-emp/:userid" element={<HistoPaidSalEmp />} /> */}


        <Route path="/create-salaire" element={<CreateSalaire />} />
        <Route path="/paid-salaire/:salaryId/:userid" element={<PaidSalaire />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;