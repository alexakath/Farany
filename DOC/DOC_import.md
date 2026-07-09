### raha afaka mampiditra ao am import 

# ajouter ces attribut
  
  const [newTicket, setNewTicket] = useState("");
  const [newMvt, setNewMvt] = useState("open");
  const [newValeur, setNewValeur] = useState("");


 # MODIF
  const handleCellChange = (index, field, value) => {
    setFiles((prev) => {
      const updatedData = [...prev.feuille3.data];
      updatedData[index] = { ...updatedData[index], [field]: value };
      return {
        ...prev,
        feuille3: { ...prev.feuille3, data: updatedData }
      };
    });
  };

  # DELETE
  const handleDeleteRow = (index) => {
    setFiles((prev) => {
      const updatedData = prev.feuille3.data.filter((_, i) => i !== index);
      return {
        ...prev,
        feuille3: { ...prev.feuille3, data: updatedData.length > 0 ? updatedData : null }
      };
    });
    addLog(`Ligne ${index + 1} supprimée de l'aperçu.`, "warn");
  };

  # ADD
  const handleAddRow = (e) => {
    e.preventDefault();
    if (!newTicket.trim() || !newValeur.trim()) {
      alert("Veuillez remplir la référence du ticket et la valeur.");
      return;
    }

    const newRow = {
      ticket: newTicket.trim(),
      mvt: newMvt,
      valeur: newValeur.trim()
    };

    setFiles((prev) => {
      const currentData = prev.feuille3.data || [];
      return {
        ...prev,
        feuille3: {
          ...prev.feuille3,
          name: prev.feuille3.name || "Saisie manuelle",
          data: [...currentData, newRow]
        }
      };
    });

    // Réinitialiser le formulaire d'ajout
    setNewTicket("");
    setNewValeur("");
    addLog(`✓ Ligne ajoutée manuellement pour le Ticket: ${newRow.ticket}`, "info");
  };


  
#   {/* ADD */}
        <form onSubmit={handleAddRow}>
          <div className="flex-1">
            <label>Ticket (Réf)</label>
            <input 
              type="text" value={newTicket} onChange={(e) => setNewTicket(e.target.value)}
              placeholder="Ex: TKT-123"
            />
          </div>
          <div>
            <label>Mouvement</label>
            <select 
              value={newMvt} onChange={(e) => setNewMvt(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <div className="w-24">
            <label>Valeur (€)</label>
            <input 
              type="text" value={newValeur} onChange={(e) => setNewValeur(e.target.value)}
              placeholder="150.00"
            />
          </div>
          <button 
            type="submit" 
          >
           Ajouter
          </button>
        </form>

#  {/* Modifier MVT */}
                    <td className="p-1">
                      <select 
                        value={row.mvt} 
                        onChange={(e) => handleCellChange(index, "mvt", e.target.value)}
                        className="p-1 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white font-medium"
                      >
                        <option value="open">open</option>
                        <option value="closed">closed</option>
                        <option value="cancel">cancel</option>
                      </select>
                    </td>
# {/* Modifier Valeur */}
                    <td className="p-1">
                      <input 
                        type="text" value={row.valeur} 
                        onChange={(e) => handleCellChange(index, "valeur", e.target.value)}
                        className="w-full p-1 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white font-mono"
                      />
                    </td>
# {/* Supprimer Ligne */}
                    <td className="p-1 text-center">
                      <button 
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                        title="Supprimer cette ligne"
                      >
                        Supprimer
                      </button>
                    </td>

# arecu

Declarer na le ficheir
  const hasDataToImport =files.feuille3.data;

{/* Aperçu des données sous forme de Tableau ─── */}
      {hasDataToImport && (
        <div>
          <div>

            <h2>Aperçu du fichier : {files.feuille3.name}</h2>
            <span>
              {files.feuille3.data.length} lignes
            </span>
          </div>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Ticket (Ref)</th>
                  <th>Mouvement (MVT)</th>
                  <th>Valeur (Coût)</th>
                </tr>
              </thead>
              <tbody>
                {files.feuille3.data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td>{getField(row, "ticket")}</td>
                    <td>{getField(row, "mvt")}</td>
                    <td>{getField(row, "valeur") || "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      

Asina condition oh zao amle  bouton 

  <button
          onClick={startImport}
          disabled={running || !hasDataToImport}
          className={`px-5 py-2 rounded-lg text-sm font-medium ${
            hasDataToImport && !running
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400"
          }`}
        >