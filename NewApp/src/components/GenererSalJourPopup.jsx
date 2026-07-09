import { useState } from "react";
function GenererSalJourPopup({ isOpen, onClose, onSubmit, userCount }) {
    const [inputs, setInputs] = useState({
        montantjour: "",
        majoration:"",
        mois:"",
        annee:""
    });

    // Si le popup n'est pas ouvert, on ne l'affiche pas
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // On renvoie les inputs au composant parent
        onSubmit(inputs);
        // On réinitialise le formulaire
        setInputs({ montant: "", majoration: "", mois: "" , annee: "" });
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                width: "400px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.3)"
            }}>
                <h3>Générer salaire par jours pour les {userCount} utilisateur(s) sélectionné(s)</h3>
                
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Montant par Jour:</label>
                        <input 
                            type="number" 
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.montant}
                            onChange={(e) => setInputs({...inputs, montant: e.target.value})}
                        />
                    </div>

                    {/* maj */}
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Majoration :</label>
                        <input 
                            type="number" 
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.majoration}
                            onChange={(e) => setInputs({...inputs, majoration: e.target.value})}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}> Mois :</label>
                        <input 
                            type="number" 
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.mois}
                            onChange={(e) => setInputs({...inputs, mois: e.target.value})}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Annee :</label>
                        <input 
                            type="number" 
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.annee}
                            onChange={(e) => setInputs({...inputs, annee: e.target.value})}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            style={{ padding: "8px 15px", backgroundColor: "#aaa", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit"
                            style={{ padding: "8px 15px", backgroundColor: "#008CBA", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                            Confirmer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GenererSalJourPopup;