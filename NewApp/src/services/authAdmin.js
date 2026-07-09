const mdp = import.meta.env.VITE_ADMIN_PASSWORD;


const AuthAdmin = {
    login : async (inputPassword) => {
        if (inputPassword === mdp) {
            localStorage.setItem("isAdmin", "true");
            return true;
        } else {
            return false;
        }
    },
    logout : () => {
        localStorage.removeItem("isAdmin");
    },
    isAuthenticated : () => {
        return localStorage.getItem("isAdmin") === "true";
    }
}
export default AuthAdmin;