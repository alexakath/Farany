import DashAmountGender from "../../components/Dash/DashAmountGender";
import DashAmountMonth from "../../components/Dash/DashAmountMonth";
import "../../assets/page/Dashboard.css";
import Sidebar from "../../components/Sidebar";
function Dashboard() {

    return(
        <div>
            <Sidebar />
            <h1>Dashboard General PAIEMENT</h1>
            <h2>GENRE</h2>
            <DashAmountGender />
            <h2>MOIS</h2>
            <DashAmountMonth />
        </div>
    )
}
export default Dashboard;