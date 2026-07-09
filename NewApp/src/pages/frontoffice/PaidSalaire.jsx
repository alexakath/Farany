import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SalariesService from "../../services/SalariesService";
import "../../assets/page/PaidSalaire.css";
import Navbar from "../../components/Navbar";

function PaidSalaire() {
  const { salaryId, userid } = useParams();

  // 1. Initialisation avec un tableau contenant une première ligne par défaut
  const [payments, setPayments] = useState([
    {
      date: new Date().toISOString().split("T")[0],
      montant: "",
    },
  ]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Ajouter une nouvelle ligne de paiement
  const handleAddRow = () => {
    setPayments([
      ...payments,
      {
        date: new Date().toISOString().split("T")[0],
        montant: "",
      },
    ]);
  };

  // Supprimer une ligne de paiement (optionnel mais recommandé)
  const handleRemoveRow = (index) => {
    if (payments.length === 1) return; // Garder au moins une ligne
    const updatedPayments = payments.filter((_, i) => i !== index);
    setPayments(updatedPayments);
  };

  // Gérer les changements d'inputs dynamiquement par index de ligne
  const handleInputChange = (index, field, value) => {
    const updatedPayments = payments.map((payment, i) => {
      if (i === index) {
        return { ...payment, [field]: value };
      }
      return payment;
    });
    setPayments(updatedPayments);
  };

  const toUnixTimestamp = (dateStr) => {
    if (!dateStr) return null;
    const timestamp = Date.parse(dateStr);
    if (!isNaN(timestamp)) {
      return Math.floor(timestamp / 1000);
    }
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.trim().split("/");
      const fullYear = y.length === 2 ? `20${y}` : y;
      const parsedDate = new Date(`${fullYear}-${m}-${d}T00:00:00`);
      return !isNaN(parsedDate.getTime()) ? Math.floor(parsedDate.getTime() / 1000) : null;
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation globale : vérifier que toutes les lignes sont remplies
    const hasInvalidRow = payments.some((p) => !p.montant || !p.date);
    if (hasInvalidRow) {
      setError("Veuillez remplir le montant et la date pour toutes les lignes.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Calcul du montant total cumulé de toutes les lignes
      const totalAmount = payments.reduce((sum, p) => sum + Number(p.montant), 0);

      // Utilisation de la date de la première ligne ou de la date du jour pour l'entête global Dolibarr
      const globalDateUnix = toUnixTimestamp(payments[0].date);

      if (!globalDateUnix) {
        throw new Error("Le format de la date est invalide.");
      }

      // Payload adapté à la structure attendue par l'API Dolibarr (avec tableau de montants par salaire)
      const paymentPayload = {
        datep: globalDateUnix,
        datepaye: globalDateUnix,     // ou "2026-07-01" selon ce que l'API attend
        paiementtype: 1,               // ou fk_typepayment: 1 suivant ton endpoint
        chid: 1,
        amount: Number(totalAmount),
        amounts: {
          [salaryId]: Number(totalAmount)
        },
        accountid: 1
      };

      console.log("Payload envoyé :", JSON.stringify(paymentPayload, null, 2));

      await SalariesService.createPaid(salaryId, paymentPayload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Enregistrer un Paiement Multiple</h2>
      <form onSubmit={handleSave}>

        {payments.map((payment, index) => (
          <div key={index} className="payment-row" style={{ display: "flex", gap: "15px", marginBottom: "10px", alignItems: "center" }}>
            <span>#{index + 1}</span>

            <div>
              <label>Date : </label>
              <input
                type="date"
                value={payment.date}
                onChange={(e) => handleInputChange(index, "date", e.target.value)}
              />
            </div>

            <div>
              <label>Montant : </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={payment.montant}
                onChange={(e) => handleInputChange(index, "montant", e.target.value)}
              />
              <span> €</span>
            </div>

            {/* Bouton de suppression (affiché uniquement s'il y a plus d'une ligne) */}
            {payments.length > 1 && (
              <button type="button" onClick={() => handleRemoveRow(index)} style={{ color: "red" }}>
                Supprimer
              </button>
            )}

            {/* Le bouton "+" s'affiche uniquement sur la dernière ligne */}
            {index === payments.length - 1 && (
              <button type="button" onClick={handleAddRow} style={{ fontWeight: "bold" }}>
                + Ajouter un paiement
              </button>
            )}
          </div>
        ))}

        <hr />

        <div style={{ marginBottom: "15px" }}>
          <strong>Total cumulé : </strong>
          {payments.reduce((sum, p) => sum + (Number(p.montant) || 0), 0).toFixed(2)} €
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Traitement..." : "Valider tous les paiements"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Paiements enregistrés avec succès ✅</p>}
    </div>
  );
}

export default PaidSalaire;