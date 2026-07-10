import DashSalGender from "../../components/Dash/DashSalGender";
import DashSalMonth from "../../components/Dash/DashSalMonth";
import "../../assets/page/Dashboard.css";
import Sidebar from "../../components/Sidebar";

function DashboardSal() {
    return (
        <div className="dashboard-page">
            <Sidebar />
            <div className="page-header">
                <h1>Dashboard General SALAIRE</h1>
            </div>
            <DashSalGender />
            <DashSalMonth />
        </div>
    );
}

export default DashboardSal;
