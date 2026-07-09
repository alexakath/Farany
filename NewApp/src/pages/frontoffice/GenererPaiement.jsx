import { useState, useEffect } from "react";
import UserService from "../../services/UserService";
import SalariesService from "../../services/SalariesService";
import Navbar from "../../components/Navbar";
import "../../assets/page/ListeSalaire.css";
import "../../assets/page/GenererPaiement.css";

function GenererPaiement() {
  const [users, setUsers] = useState([]);
  const [salaires, setSalaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [resultats, setResultats] = useState([]);

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




  const usersById = {};
  users.forEach((u) => { usersById[u.id] = u; });

  // Une fiche "appartient" au mois filtré si sa période [datesp, dateep] chevauche
  // ce mois calendaire — pas seulement si datesp tombe pile dedans. Nécessaire car
  // les périodes de paie débordent souvent d'un mois sur l'autre (ex: 31/01 -> 28/02
  // est la paie de février, même si datesp est techniquement en janvier).
  const estDuMois = (datesp, dateep) => {
    if (!datesp) return false;
    const debut = new Date(Number(datesp) * 1000);
    const fin = dateep ? new Date(Number(dateep) * 1000) : debut;
    const cibleDebut = new Date(Number(paie.annee), Number(paie.mois) - 1, 1);
    const cibleFin = new Date(Number(paie.annee), Number(paie.mois), 0, 23, 59, 59);
    return debut <= cibleFin && fin >= cibleDebut;
  };

  
  const handlePayer = async () => {
    setError(null);
    setResultats([]);

    
    if (!paie.mois || !paie.annee || !paie.montant || Number(paie.montant) <= 0) {
      setError("Renseignez le mois, l'année et un montant à répartir supérieur à 0.");
      return;
    }
    if (users.length === 0) {
      setError("Aucun employé trouvé.");
      return;
    }


    const salairesDuMois = salaires.filter((s) => estDuMois(s.datesp, s.dateep));
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
          datesp: Number(sal.datesp),
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
          setResultats([...resultatsFaits]);
          continue;
        }

        if (budget <= 0) {
          resultatsFaits.push({ ...ligne, montantPaye: 0, resteApres: reste, statut: "Non payé (budget épuisé)" });
          setResultats([...resultatsFaits]);
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

        // Un échec sur ce salaire ne doit pas faire perdre la trace des paiements
        // déjà effectués avant lui dans la boucle (ils sont réellement enregistrés côté Dolibarr).
        try {
          await SalariesService.createPaid(salaryId, payload);
          budget = Math.round((budget - aPayer) * 100) / 100;
          resultatsFaits.push({
            ...ligne,
            montantPaye: aPayer,
            resteApres: Math.round((reste - aPayer) * 100) / 100,
            statut: aPayer >= reste ? "Soldé" : "Partiel",
          });
        } catch (payErr) {
          resultatsFaits.push({
            ...ligne,
            montantPaye: 0,
            resteApres: reste,
            statut: "Erreur",
            erreur: payErr.message || "Échec de l'enregistrement du paiement.",
          });
        }
        setResultats([...resultatsFaits]);
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

  const parAnciennete = [...resultats].sort((a, b) => a.datesp - b.datesp);
  const totalSalaires = parAnciennete.reduce((s, r) => s + r.montantSalaire, 0);
  const totalPayeCumule = parAnciennete.reduce((s, r) => s + r.dejaPaye + r.montantPaye, 0);
  const totalReste = parAnciennete.reduce((s, r) => s + r.resteApres, 0);

  const statutBadgeClass = (statut) => {
    if (statut === "Soldé" || statut === "Déjà soldé (import)") return "paid";
    if (statut === "Erreur") return "overdue";
    return "pending"; // "Partiel" et "Non payé (budget épuisé)"
  };

  return (
    <div className="generer-paiement-page">
      <Navbar />
      <div className="page-header">
        <h1><span className="header-icon">💵</span> Paiement par mois</h1>
      </div>

      {/* FILTRES / FORMULAIRE DE PAIEMENT */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#272c68",
          borderRadius: "8px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label>Mois : </label>
          <input
            type="number"
            min="1"
            max="12"
            placeholder="Ex: 7"
            value={paie.mois}
            onChange={(e) => setPaie({ ...paie, mois: e.target.value })}
            style={{ width: "70px" }}
          />
        </div>

        <div>
          <label>Année : </label>
          <input
            type="number"
            placeholder="Ex: 2026"
            value={paie.annee}
            onChange={(e) => setPaie({ ...paie, annee: e.target.value })}
            style={{ width: "90px" }}
          />
        </div>

        <div>
          <label>Poste prioritaire : </label>
          <select
            value={paie.postePriorite}
            onChange={(e) => setPaie({ ...paie, postePriorite: e.target.value })}
          >
            <option value="">Aucun</option>
            {uniqueJobs.map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Montant à payer : </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={paie.montant}
            onChange={(e) => setPaie({ ...paie, montant: e.target.value })}
            style={{ width: "110px" }}
          />
        </div>

        <button
          onClick={handlePayer}
          disabled={paying}
          style={{
            backgroundColor: paying ? "#ccc" : "#4CAF50",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: paying ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {paying ? "Paiement en cours..." : "Payer"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {resultats.length > 0 && (
        <>
          <div className="table-wrapper" style={{ marginBottom: "24px" }}>
            <h2 className="generer-paiement-subtitle">Déroulé du paiement</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Salarié</th>
                  <th>Poste</th>
                  <th>Période</th>
                  <th>Montant salaire</th>
                  <th>Déjà payé (avant)</th>
                  <th>Montant payé</th>
                  <th>Reste après</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((r, i) => (
                  <tr key={`${r.salaryId}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{r.employe}</td>
                    <td>{r.poste || "—"}</td>
                    <td>{r.periode}</td>
                    <td>{r.montantSalaire.toFixed(2)} €</td>
                    <td>{r.dejaPaye.toFixed(2)} €</td>
                    <td>{r.montantPaye.toFixed(2)} €</td>
                    <td>{r.resteApres.toFixed(2)} €</td>
                    <td>
                      <span className={`status-badge ${statutBadgeClass(r.statut)}`} title={r.erreur || ""}>
                        {r.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrapper">
            <h2 className="generer-paiement-subtitle">Récapitulatif trié par ancienneté</h2>
            <table>
              <thead>
                <tr>
                  <th>Salarié</th>
                  <th>Poste</th>
                  <th>Période</th>
                  <th>Montant salaire</th>
                  <th>Montant payé (total)</th>
                  <th>Reste à payer</th>
                </tr>
              </thead>
              <tbody>
                {parAnciennete.map((r, i) => (
                  <tr key={`${r.salaryId}-anc-${i}`}>
                    <td>{r.employe}</td>
                    <td>{r.poste || "—"}</td>
                    <td>{r.periode}</td>
                    <td>{r.montantSalaire.toFixed(2)} €</td>
                    <td>{(r.dejaPaye + r.montantPaye).toFixed(2)} €</td>
                    <td>{r.resteApres.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={3}>
                    Total ({parAnciennete.length} salarié{parAnciennete.length > 1 ? "s" : ""})
                  </td>
                  <td>{totalSalaires.toFixed(2)} €</td>
                  <td>{totalPayeCumule.toFixed(2)} €</td>
                  <td>{totalReste.toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default GenererPaiement;