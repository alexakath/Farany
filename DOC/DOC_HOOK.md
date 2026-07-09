**Les Hooks React (`useState`, `useEffect`, `useNavigate`, etc.) sont des fonctions qui permettent d’ajouter des fonctionnalités avancées (gestion d’état, effets secondaires, navigation, optimisation) dans des composants fonctionnels.** Ils remplacent les anciennes classes et rendent le code plus clair et modulaire. Voici une documentation complète et pratique avec explications et exemples.  

---

## 🔑 Principaux Hooks

### 1. **useState**
- **Rôle** : gérer un état local (valeur qui change dans le temps).  
- **Syntaxe** :  
  ```jsx
  const [count, setCount] = useState(0);
  ```
- **Exemple** : compteur simple  
  ```jsx
  function Counter() {
    const [count, setCount] = useState(0);
    return (
      <div>
        <p>Valeur : {count}</p>
        <button onClick={() => setCount(count + 1)}>+1</button>
      </div>
    );
  }
  ```

---

### 2. **useEffect**
- **Rôle** : exécuter du code en réaction à un changement (API call, DOM, timer).  
- **Syntaxe** :  
  ```jsx
  useEffect(() => {
    // code exécuté après le rendu
    return () => {
      // cleanup (avant démontage ou mise à jour)
    };
  }, [dependencies]);
  ```
- **Exemple** : appel API  
  ```jsx
  useEffect(() => {
    fetch("https://api.example.com/data")
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);
  ```

---

### 3. **useNavigate** (React Router v6)
- **Rôle** : gérer la navigation programmatique entre pages.  
- **Syntaxe** :  
  ```jsx
  import { useNavigate } from "react-router-dom";
  const navigate = useNavigate();
  ```
- **Exemple** : redirection après connexion  
  ```jsx
  function Login() {
    const navigate = useNavigate();
    const handleLogin = () => {
      // logique de connexion
      navigate("/dashboard");
    };
    return <button onClick={handleLogin}>Se connecter</button>;
  }
  ```

---

## 📚 Autres Hooks utiles
| Hook | Rôle | Exemple |
|------|------|---------|
| **useContext** | Consommer des données partagées via un *Context*. | `const theme = useContext(ThemeContext)` |
| **useReducer** | Gérer un état complexe avec une fonction réductrice. | `const [state, dispatch] = useReducer(reducer, initialState)` |
| **useRef** | Stocker une valeur persistante (DOM, timer). | `const inputRef = useRef(null)` |
| **useMemo** | Mémoriser une valeur calculée pour éviter des recalculs. | `const result = useMemo(() => compute(data), [data])` |
| **useCallback** | Mémoriser une fonction pour éviter de la recréer. | `const handleClick = useCallback(() => {...}, [])` |

---

## ⚠️ Bonnes pratiques
- Toujours appeler les Hooks **au niveau supérieur** du composant (pas dans des boucles ou conditions).  
- Les noms doivent commencer par `use`.  
- Utiliser `useEffect` uniquement pour interagir avec des systèmes externes (API, DOM).  
- Respecter la convention `valeur / setValeur` pour `useState` afin de garder le code lisible.  

---

👉 Marie, veux-tu que je prépare un **schéma visuel comparatif** (tableau ou diagramme) des Hooks les plus utilisés (`useState`, `useEffect`, `useNavigate`, etc.) pour ton cours afin de rendre leur rôle encore plus clair et pédagogique ?