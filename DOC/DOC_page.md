En React, il existe plusieurs façons de **transférer ou partager des données d’une page à une autre**. Cela dépend du type de données et de la structure de ton application. Voici les méthodes principales :

---

## 🔑 1. Via les **props** et `react-router-dom`
- Tu peux passer des données en **paramètres de navigation** avec `useNavigate` :
   ```jsx
   import { useNavigate } from "react-router-dom";

   function PageA() {
     const navigate = useNavigate();
     const data = { id: 1, nom: "Marie" };

     return (
       <button onClick={() => navigate("/pageB", { state: data })}>
         Aller vers Page B
       </button>
     );
   }
   ```

   Et dans **PageB** :
   ```jsx
   import { useLocation } from "react-router-dom";

   function PageB() {
     const location = useLocation();
     const data = location.state;

     return <h1>Nom reçu : {data.nom}</h1>;
   }
   ```

👉 Avantage : simple et pratique pour des données temporaires.

---

## 🔑 2. Via un **state global** (Context API ou Redux)
- Si tu veux partager des données entre plusieurs pages sans passer par des props :
   ```jsx
   import { createContext, useContext, useState } from "react";

   const AppContext = createContext();

   export function AppProvider({ children }) {
     const [user, setUser] = useState({ id: 1, nom: "Marie" });
     return (
       <AppContext.Provider value={{ user, setUser }}>
         {children}
       </AppContext.Provider>
     );
   }

   export function useAppContext() {
     return useContext(AppContext);
   }
   ```

   Dans **PageA** :
   ```jsx
   import { useAppContext } from "./AppProvider";

   function PageA() {
     const { setUser } = useAppContext();
     return (
       <button onClick={() => setUser({ id: 2, nom: "Jean" })}>
         Changer utilisateur
       </button>
     );
   }
   ```

   Dans **PageB** :
   ```jsx
   import { useAppContext } from "./AppProvider";

   function PageB() {
     const { user } = useAppContext();
     return <h1>Utilisateur : {user.nom}</h1>;
   }
   ```

👉 Avantage : idéal pour des données persistantes dans toute l’application.

---

## 🔑 3. Via le **localStorage / sessionStorage**
- Pour garder les données même après un rechargement :
   ```jsx
   // Dans PageA
   localStorage.setItem("nom", "Marie");

   // Dans PageB
   const nom = localStorage.getItem("nom");
   console.log(nom); // "Marie"
   ```

👉 Avantage : persistant même après F5 ou fermeture du navigateur.

---

## 📊 Comparatif rapide

| Méthode            | Usage idéal |
|--------------------|-------------|
| `navigate` + state | Données temporaires entre deux pages |
| Context / Redux    | Données globales partagées dans toute l’app |
| localStorage       | Données persistantes même après refresh |

---

💡 Conseil : si tu veux juste **passer une valeur d’une page à une autre**, utilise `navigate` avec `state`. Si tu veux gérer des **données partagées partout**, utilise **Context API**.  

Veux-tu que je te montre un **exemple complet avec `navigate` et `useLocation`** pour que tu puisses tester directement dans ton projet React ?