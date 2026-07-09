###### CHECK LES JOURS FERIER 

### raha oh ka misy jour ferier entre date salaire 

## Fonction 
```javascript
 checkFerieInSalary: async (salaryId) => {
    const joursFeries = await JourFerieService.getAll();
    const salaire = await SalariesService.getById(salaryId);

    if (!salaire) {
        throw new Error(`Salaire avec l'ID ${salaryId} introuvable.`);
    }

    // 1. On récupère les dates réelles du salaire (ex: 01/12/2026 au 31/12/2026)
    const debutsal = new Date(salaire.datesp * 1000);
    const finsal = new Date(salaire.dateep * 1000);
    debutsal.setHours(0, 0, 0, 0);
    finsal.setHours(0, 0, 0, 0);

    let nombreJoursFeriesTotal = 0;
    const feriesDansIntervalle = [];

    // On extrait les années de la période de salaire (ex: 2026)
    const anneeDebut = debutsal.getFullYear();
    const anneeFin = finsal.getFullYear();

    // 2. On boucle sur vos jours fériés "modèles"
    for (const jour of joursFeries) {
        const dateOrigine = new Date(jour.dateDebut); // ex: 25/12/2025 en BDD
        
        const moisFerie = dateOrigine.getMonth(); // ex: 11 (Décembre en JS)
        const jourFerie = dateOrigine.getDate();  // ex: 25

        // On teste le jour/mois férié pour chaque année couverte par le salaire
        for (let annee = anneeDebut; annee <= anneeFin; annee++) {
            
            // ICI : On recrée le 25/12 mais avec l'année du salaire (2026)
            const ferieProjette = new Date(annee, moisFerie, jourFerie, 0, 0, 0, 0);

            // Vérification : Est-ce que le 25/12/2026 est entre le début et la fin du salaire ?
            const chevauche = ferieProjette >= debutsal && ferieProjette <= finsal;

            if (chevauche) {
                nombreJoursFeriesTotal += 1; // C'est un jour unique (le 25/12)
                
                // On ajoute le jour férié aux détails s'il n'y est pas déjà
                if (!feriesDansIntervalle.includes(jour)) {
                    feriesDansIntervalle.push(jour);
                }
            }
        }
    }

    return {
        existe: feriesDansIntervalle.length > 0,
        nombreDePeriodes: feriesDansIntervalle.length,
        nombreDeJours: nombreJoursFeriesTotal,
        details: feriesDansIntervalle,
    };
}
```
## Page ampiseovana azy 
``` javascript
import SalariesService from "../../../services/SalariesService";
import { useState, useEffect } from "react";

function CheckFerie() {
    const [salaries, setSalaries] = useState([]);
    const [loadingSalaries, setLoadingSalaries] = useState(true);
    const [selectedSalaryId, setSelectedSalaryId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString("fr-FR");
    };
    // Récupération de la liste des salaires au montage
    useEffect(() => {
        const fetchSalaries = async () => {
            try {
                setLoadingSalaries(true);
                const data = await SalariesService.getAll();
                // console.log("getAllSalaire",data);
                setSalaries(data);
                if (data.length > 0) {
                    setSelectedSalaryId(String(data[0].id));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingSalaries(false);
            }
        };

        fetchSalaries();
    }, []);

    const checkFerieInSalary = async (salaryId) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await SalariesService.checkFerieInSalary(salaryId);
            console.log("checkdata", data);

            setResult(data);
            console.log("result", data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Calculateur de Jours Fériés / Salaire</h2>

            <label style={styles.label}>Choisir un employé :</label>

            {loadingSalaries ? (
                <p>Chargement des salariés...</p>
            ) : (
                <select
                    value={selectedSalaryId}
                    onChange={(e) => setSelectedSalaryId(e.target.value)}
                    style={styles.select}
                >
                    {salaries.map((salaire) => (
                        <option key={salaire.id} value={salaire.id}>
                            ID {salaire.id} : {salaire.nom || salaire.employeNom || `Salarié ${salaire.id}`}
                            {salaire.datesp && salaire.dateep
                                ? ` (${formatDate(salaire.datesp)} au ${formatDate(salaire.dateep)})`
                                : ""}
                        </option>
                    ))}
                </select>
            )}

            <button
                onClick={() => checkFerieInSalary(selectedSalaryId)}
                disabled={loading || loadingSalaries || !selectedSalaryId}
                style={styles.button}
            >
                {loading ? "Vérification en cours..." : "Vérifier la période"}
            </button>

            {error && <div style={{ ...styles.result, ...styles.error }}>{error}</div>}

            {result && (
                <div style={{
                    ...styles.result,
                    ...(result.existe ? styles.success : styles.info)
                }}>
                    <strong>{result.existe ? "Jours feries trouves !" : "Aucun jour férié"}</strong>
                    {/* <p style={{ margin: "10px 0" }}>
                        {result.existe
                            ? `Il y a eu ${result.nombreDeJours} jour(s) férié(s) durant cette période (${result.nombreDePeriodes} période(s)).`
                            : "Cette période de salaire ne contient aucun jour férié."}
                    </p> */}

                    <label style={{ fontWeight: 'bold', fontSize: '12px' }}>Détails du JSON :</label>
                    <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: "450px", margin: "40px auto", padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
    title: { fontSize: "20px", color: "#333", marginBottom: "20px", textAlign: "center" },
    label: { display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555" },
    select: { width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "15px", fontSize: "15px" },
    button: { width: "100%", padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#007bff", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
    result: { marginTop: "20px", padding: "15px", borderRadius: "6px", border: "1px solid" },
    success: { backgroundColor: "#e2f0d9", color: "#385723", borderColor: "#c5e0b4" },
    info: { backgroundColor: "#deebf7", color: "#1f4e78", borderColor: "#bdd7ee" },
    error: { backgroundColor: "#fce4d6", color: "#c65911", borderColor: "#f8cbad" },
    pre: { background: "#f2f2f2", padding: "10px", borderRadius: "4px", fontSize: "11px", overflowX: "auto", marginTop: "5px" }
};

export default CheckFerie;
```