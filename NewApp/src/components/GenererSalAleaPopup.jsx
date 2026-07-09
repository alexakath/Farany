import { useState } from "react";

// Popup de génération de salaire "Alea" :
// - salaireJour : montant payé par jour travaillé
// - pourcentage : majoration (%) appliquée sur les jours fériés
function GenererSalAleaPopup({ isOpen, onClose, onSubmit, userCount }) {
    const [inputs, setInputs] = useState({
        salaireJour: "",
        pourcentage: "",
        mois: "",
        annee: "",
        travailleSamedi: false,
        travailleDimanche: false,
        pourcentageWeekend: "",
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(inputs);
        setInputs({
            salaireJour: "", pourcentage: "", mois: "", annee: "",
            travailleSamedi: false, travailleDimanche: false, pourcentageWeekend: "",
        });
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
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                width: "400px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
            }}>
                <h3>Générer salaire Alea pour les {userCount} utilisateur(s) sélectionné(s)</h3>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {/* Salaire par jour */}
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Salaire par jour :</label>
                        <input
                            type="number"
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.salaireJour}
                            onChange={(e) => setInputs({ ...inputs, salaireJour: e.target.value })}
                        />
                    </div>

                    {/* Pourcentage majoration jour férié */}
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Pourcentage majoration jour férié (%) :</label>
                        <input
                            type="number"
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.pourcentage}
                            onChange={(e) => setInputs({ ...inputs, pourcentage: e.target.value })}
                        />
                    </div>

                    {/* Mois */}
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Mois (1-12) :</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.mois}
                            onChange={(e) => setInputs({ ...inputs, mois: e.target.value })}
                        />
                    </div>

                    {/* Année */}
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Année :</label>
                        <input
                            type="number"
                            required
                            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                            value={inputs.annee}
                            onChange={(e) => setInputs({ ...inputs, annee: e.target.value })}
                        />
                    </div>

                    {/* Travail le weekend */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={inputs.travailleSamedi}
                                onChange={(e) => setInputs({ ...inputs, travailleSamedi: e.target.checked })}
                            />
                            Travaille le samedi
                        </label>
                    </div>

                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                checked={inputs.travailleDimanche}
                                onChange={(e) => setInputs({ ...inputs, travailleDimanche: e.target.checked })}
                            />
                            Travaille le dimanche
                        </label>
                    </div>

                    {(inputs.travailleSamedi || inputs.travailleDimanche) && (
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Majoration weekend (%) :</label>
                            <input
                                type="number"
                                required
                                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                                value={inputs.pourcentageWeekend}
                                onChange={(e) => setInputs({ ...inputs, pourcentageWeekend: e.target.value })}
                            />
                        </div>
                    )}

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

export default GenererSalAleaPopup;
