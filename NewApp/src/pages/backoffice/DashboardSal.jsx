import DashSalGender from "../../components/Dash/DashSalGender";
import DashSalMonth from "../../components/Dash/DashSalMonth";
import Sidebar from "../../components/Sidebar";

function DashboardSal() {

    return(
        <div>
            <Sidebar />
            <h1>Dashboard General SALAIRE</h1>
            <DashSalGender />
            <DashSalMonth />
        </div>
    )
}
export default DashboardSal;