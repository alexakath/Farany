import { useState } from "react";
import AuthAdmin from "../services/authAdmin"
import { useNavigate } from "react-router-dom";

function LoginAdmin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await AuthAdmin.login(password);
    if (success) {
      navigate("/accueil-back");
    } else {
      setError("Mot de passe incorrect");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-semibold text-slate-900">Connexion admin</h1>
          <p className="text-sm text-slate-500">Accède au backoffice de NewApp.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800">
            Se connecter
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginAdmin;