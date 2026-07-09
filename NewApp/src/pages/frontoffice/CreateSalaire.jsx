import { useEffect, useState } from "react";
import SalariesService from "../../services/SalariesService";
import UserService from "../../services/UserService";
import "../../assets/page/CreateSalaire.css";
import Navbar from "../../components/Navbar";
function CreateSalaire() {
  const [salaire, setSalaire] = useState({
    ref: '',
    id_user: '',
    datedep: '',
    datefin: '',
    montant: ''
  });

  // États pour la gestion des utilisateurs, des erreurs et du chargement
  const [users, setUsers] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Charger la liste des utilisateurs au montage du composant
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await UserService.getAll();
        // Vérifie si la réponse est un tableau (selon le format de ton API)
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch (err) {
        console.error("Erreur lors du chargement des utilisateurs:", err);
        setError("Impossible de charger la liste des salariés.");
      }
    };

    fetchUsers();
  }, []);

  // Fonction utilitaire de conversion de date en Timestamp Unix (si nécessaire pour Dolibarr)
  const toUnixTimestamp = (dateStr) => {
    if (!dateStr) return null;
    const timestamp = Date.parse(dateStr);
    return !isNaN(timestamp) ? Math.floor(timestamp / 1000) : null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!salaire.id_user || !salaire.montant || !salaire.datedep || !salaire.datefin) {
      setError("Veuillez remplir tous les champs obligatoires, y compris le salarié.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const salaryPayload = {
        ref_ext: salaire.ref,
        label: `Salaire Période du ${salaire.datedep} au ${salaire.datefin}`,
        fk_user: Number(salaire.id_user), // Converti en nombre si requis
        datesp: toUnixTimestamp(salaire.datedep), // Format Timestamp Unix
        dateep: toUnixTimestamp(salaire.datefin), // Format Timestamp Unix
        datep: toUnixTimestamp(salaire.datedep),  // Format Timestamp Unix
        salary: Number(salaire.montant),
        amount: Number(salaire.montant),
      };

      console.log("Payload envoyé :", JSON.stringify(salaryPayload, null, 2));
      const result = await SalariesService.create(salaryPayload);
      setSuccess(true);
      console.log("Salaire créé avec succès !", result); 
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div>
        <h2>Créer un nouveau Salaire</h2>
      </div>

      <form onSubmit={handleSave}>
        <div>
          <label>Ref</label>
          <input 
            type="number" 
            placeholder="Ex: 12"
            value={salaire.ref} 
            onChange={(e) => setSalaire({...salaire, ref: e.target.value})}
          />
        </div>

        {/* 2. MENU DÉROULANT DES UTILISATEURS */}
        <div>
          <label>Salarié</label>
          <select
            value={salaire.id_user}
            onChange={(e) => setSalaire({...salaire, id_user: e.target.value})}
          >
            <option value="">-- Sélectionner un salarié --</option>
            {users.map((u) => (
              // On utilise l'ID (u.id) comme valeur de l'option, et on affiche son nom/prénom
              <option key={u.id} value={u.id}>
                {u.lastname ? `${u.lastname} ${u.firstname || ''}` : u.login || `ID: ${u.id}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div>
            <label>Date Début</label>
            <input 
              type="date"
              value={salaire.datedep}
              onChange={(e) => setSalaire({...salaire, datedep: e.target.value})}
            />
          </div>
          <div>
            <label>Date fin</label>
            <input 
              type="date"
              value={salaire.datefin}
              onChange={(e) => setSalaire({...salaire, datefin: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label>Montant</label>
          <div>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={salaire.montant}
              onChange={(e) => setSalaire({...salaire, montant: e.target.value})}
            />
            <div>€</div>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Salaire créé avec succès ✅</p>}
    </div>
  );
}

export default CreateSalaire;