import { useState, useEffect } from "react";
import UserService from "../../services/UserService";
import SalariesService from "../../services/SalariesService";
import Navbar from "../../components/Navbar";

function GenererPaiement() {
  const [users, setUsers] = useState([]);
  const [salaires, setSalaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [resultats, setResultats] = useState([]); 


 
  const [filters, setFilters] = useState({
    searchName: "", gender: "", job: "", minHours: "", maxHours: "",
  });

 
  const [paie, setPaie] = useState({
    postePriorite: "", mois: "", annee: "", montant: "",
  });

  
  const toUnixTimestamp =(dateStr) => {
    if(!dateStr) return null;
    const timestamp =Date.parse(dateStr);
    return !isNaN(timestamp)?Math.floor(timestamp/1000) : null
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, salairesData] = await Promise.all([
          UserService.getAll(),
          SalariesService.getAll(),
        ]);
        setUsers(usersData);
        setSalaires(salairesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueJobs = [...new Set(users.map((u) => u.job).filter(Boolean))].sort();




  const filteredUsers = users.filter((user) => {
    const matchesName = user.lastname
      ? user.lastname.toLowerCase().includes(filters.searchName.toLowerCase())
      : true;
    const matchesGender = filters.gender ? user.gender === filters.gender : true;
    const matchesJob = filters.job ? user.job === filters.job : true;
    const matchesHours =
      (filters.minHours ? Number(user.weeklyhours) >= Number(filters.minHours) : true) &&
      (filters.maxHours ? Number(user.weeklyhours) <= Number(filters.maxHours) : true);
    return matchesName && matchesGender && matchesJob && matchesHours;
  });

  const usersById = {};
  users.forEach((u) => { usersById[u.id] = u; });

  const estDuMois = (datesp) => {
    if (!datesp) return false;
    const d = new Date(Number(datesp) * 1000);
    return d.getMonth() === Number(paie.mois) - 1 && d.getFullYear() === Number(paie.annee);
  };

  
  const handlePayer = async () => {
    setError(null);
    setResultats([]);

    
    if (!paie.mois || !paie.annee || !paie.montant) {
      setError("Renseignez le mois, l'année et le montant à répartir.");
      return;
    }
    if (filteredUsers.length === 0) {
      setError("Aucun employé ne correspond aux filtres.");
      return;
    }

    
    const idsFiltres = new Set(filteredUsers.map((u) => String(u.id)));
    const salairesDuMois = salaires.filter(
      (s) => idsFiltres.has(String(s.fk_user)) && estDuMois(s.datesp)
    );
    if (salairesDuMois.length === 0) {
      setError("Aucun salaire à payer pour ce mois avec ces filtres.");
      return;
    }

    
    const jobOf = (fkUser) => usersById[fkUser]?.job || "";
    salairesDuMois.sort((a, b) => {
      if (paie.postePriorite) {
        const aPrio = jobOf(a.fk_user) === paie.postePriorite ? 0 : 1;
        const bPrio = jobOf(b.fk_user) === paie.postePriorite ? 0 : 1;
        if (aPrio !== bPrio) return aPrio - bPrio;
      }
      return Number(a.datesp) - Number(b.datesp);
    });

    setPaying(true);
    try {
     
      let tousPaiements = [];
      try {
        tousPaiements = await SalariesService.getAllPaid();
      } catch {
        tousPaiements = []; 
      }

      
      
      const montantDejaPaye = (sal) =>
        tousPaiements
          .filter((p) => {
            const fk =
              p.fk_salary && typeof p.fk_salary === "object"
                ? p.fk_salary.rowid || p.fk_salary.id
                : p.fk_salary;
            const key = String(fk).trim();
            return key === String(sal.id).trim() || key === String(sal.ref).trim();
          })
          .reduce((s, p) => s + Number(p.amount || p.total || 0), 0);

      
      let budget = Number(paie.montant);
      const datepUnix = toUnixTimestamp(
        `${paie.annee}-${String(paie.mois).padStart(2, "0")}-01`
      );
      const resultatsFaits = [];

      for (const sal of salairesDuMois) {
        const salaryId = sal.ref; 
        const montantSalaire = Number(sal.amount);
        const dejaPaye = Math.round(montantDejaPaye(sal) * 100) / 100;
        const reste = Math.round((montantSalaire - dejaPaye) * 100) / 100;

        const ligne = {
          salaryId,
          ref: sal.ref,
          employe: usersById[sal.fk_user]?.lastname || `ID ${sal.fk_user}`,
          poste: jobOf(sal.fk_user),
          periode: `${new Date(sal.datesp * 1000).toLocaleDateString("fr-FR")} -> ${new Date(
            sal.dateep * 1000
          ).toLocaleDateString("fr-FR")}`,
          montantSalaire,
          dejaPaye,
        };

        
        if (reste <= 0) {
          resultatsFaits.push({ ...ligne, montantPaye: 0, resteApres: 0, statut: "Déjà soldé (import)" });
          continue;
        }
        
        if (budget <= 0) {
          resultatsFaits.push({ ...ligne, montantPaye: 0, resteApres: reste, statut: "Non payé (budget épuisé)" });
          continue;
        }
        
        const aPayer = Math.round(Math.min(budget, reste) * 100) / 100;
        const payload = {
          datep: datepUnix,
          datepaye: datepUnix,
          paiementtype: 1,
          chid: 1,
          amount: Number(aPayer),
          amounts: { [salaryId]: Number(aPayer) },
          accountid: 1,
        };
        await SalariesService.createPaid(salaryId, payload);
        budget = Math.round((budget - aPayer) * 100) / 100;

        resultatsFaits.push({
          ...ligne,
          montantPaye: aPayer,
          resteApres: Math.round((reste - aPayer) * 100) / 100,
          statut: aPayer >= reste ? "Soldé" : "Partiel",
        });
      }

      setResultats(resultatsFaits);
      const nbPayes = resultatsFaits.filter((r) => r.montantPaye > 0).length;
      if (nbPayes === 0) {
        setError("Aucun nouveau paiement : salaires déjà soldés (import) ou budget épuisé.");
      }
    } catch (err) {
      setError(err.message || "Erreur pendant le paiement.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div>Loading...</div>;

 
}

export default GenererPaiement;