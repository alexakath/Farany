import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import {useDolibarrImporter} from "../../services/ImportReset/Import";
import { RefreshIcon } from "../../components/Icons";
import "../../assets/page/Import.css";
import Sidebar from "../../components/Sidebar";

function ImportPage() {
  const [files, setFiles] = useState({
    feuille1: { data: null, name: "" },
    feuille2: { data: null, name: "" },
  });
  const [imagesZip, setImagesZip] = useState(null);
  const [zipFileName, setZipFileName] = useState("");
  const logRef = useRef(null);

  const { running, progress, logs, runImport } = useDolibarrImporter();

  // Défilement automatique vers le bas de la console de log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [logs]);

  const handleFileChange = (e, key, label) => {
    const file = e.target.files[0];
    if (!file) {
      setFiles((prev) => ({ ...prev, [key]: { data: null, name: "" } }));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFiles((prev) => ({ ...prev, [key]: { data: results.data, name: file.name } }));
      },
      error: (error) => console.error(`Erreur de lecture sur ${label} : ${error.message}`)
    });
  };

  const handleZipChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImagesZip(null);
      setZipFileName("");
      return;
    }

    setZipFileName(file.name);
    try {
      const zip = await JSZip.loadAsync(file);
      const extractedImages = {};
      
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && /\.(jfif|jpeg|jpg|png|webp|gif)$/i.test(filename)) {
          const blob = await zipEntry.async("blob");
          // Extraction du nom pur sans extension (ex: "1.png" -> "1")
          const cleanKey = filename.split('/').pop().replace(/\.[^/.]+$/, "");
          
          extractedImages[cleanKey] = {
            blob: blob,
            filename: filename.split('/').pop()
          };
        }
      }
      setImagesZip(extractedImages);
    } catch (err) {
      console.error(`Erreur de lecture de l'archive ZIP : ${err.message}`);
    }
  };

  const handleStart = () => {
    runImport(files, imagesZip);
  };

  const isFormReady = files.feuille1.data || files.feuille2.data;

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <Sidebar />
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900 flex items-center gap-2">
          <span className="text-blue-600"><RefreshIcon size={18} /></span>
          Outil d'intégration Global — Dolibarr ERP
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Importation croisée des fiches collaborateurs, photos d'identité et fiches de paie.
        </p>
      </div>

      <div className="flex flex-col gap-4 bg-gray-50 p-4 border border-gray-200 rounded-xl">
        {/* Fichier 1 — Employés */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Fichier 1 — Données Employés (.CSV)
          </label>
          <input
            type="file" accept=".csv" disabled={running}
            onChange={(e) => handleFileChange(e, "feuille1", "Fichier Employés")}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
          />
        </div>

        {/* Fichier 2 — Salaires */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Fichier 2 — Registre des Salaires (.CSV)
          </label>
          <input
            type="file" accept=".csv" disabled={running}
            onChange={(e) => handleFileChange(e, "feuille2", "Fichier Salaires")}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
          />
        </div>

        {/* Photos ZIP */}
        <div className="border-t border-gray-200 pt-3 mt-1">
          <label className="block text-xs font-bold uppercase text-indigo-600 mb-1">
            📦 Archive ZIP des Photos d'identité (Optionnel)
          </label>
          <input
            type="file" accept=".zip" disabled={running}
            onChange={handleZipChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Rendu Progression */}
      {running && (
        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Déclencheur */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleStart}
          disabled={running || !isFormReady}
          className={`px-5 py-2 rounded-lg text-sm font-medium ${
            isFormReady && !running ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-gray-200 text-gray-400"
          }`}
        >
          {running ? `Traitement (${progress}%)` : "🚀 Lancer l'importation Dolibarr"}
        </button>
      </div>

      {/* Sortie Console standard */}
      {logs.length > 0 && (
        <div ref={logRef} className="mt-5 p-4 bg-gray-950 rounded-lg font-mono text-xs max-h-64 overflow-y-auto border border-gray-800">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === "ok" ? "text-green-400" :
                l.type === "error" ? "text-red-400 font-bold" :
                l.type === "warn" ? "text-yellow-400" : "text-gray-300"
              }
            >
              {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ImportPage;