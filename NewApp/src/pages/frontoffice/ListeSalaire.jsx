import SalariesService from "../../services/SalariesService";
// import UserService from "../../services/UserService";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserService from "../../services/UserService";
import "../../assets/page/ListeSalaire.css";
import Navbar from "../../components/Navbar";



function ListeSalaire() {
    const [salaire, setSalaire] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersMap, setUsersMap] = useState({});
    // formater la date
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString("fr-FR");
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const [salaireData, allUsers] = await Promise.all([
                    SalariesService.getAll(),
                    UserService.getAll() // Récupère tous les users d'un coup
                ]);

                const userMapping = {};
                allUsers.forEach(user => {
                    userMapping[user.id] = user.lastname;
                });

                setUsersMap(userMapping);
                setSalaire(salaireData);

                console.log("verfi", salaireData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                setError(null);
            }
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <div>
            <Navbar />
            <h1>Liste des Salaires</h1>
            <table border="1">
                <thead>
                    <tr>
                        <th>Ref salaire</th>
                        <th>User</th>
                        <th>Montant</th>
                        <th>Description</th>
                        <th>Date début</th>
                        <th>Date fin</th>
                        <th>Payer Salaire</th>
                    </tr>
                </thead>
                <tbody>
                    {salaire.map((sal) => (
                        <tr key={sal.id}>
                            <td>{sal.ref}</td>
                            <td>{usersMap[sal.fk_user] || `ID: ${sal.fk_user}`}</td>
                            <td>{sal.amount}</td>
                            <td>{sal.label}</td>
                            <td>{formatDate(sal.datesp)}</td>
                            <td>{formatDate(sal.dateep)}</td>
                            <td>
                                <Link to={`/paid-salaire/${sal.ref}/${sal.fk_user}`}>Paiement</Link>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

}
export default ListeSalaire;