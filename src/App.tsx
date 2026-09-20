import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SleepLog from "./pages/SleepLog";
import ConsumptionLog from "./pages/ConsumptionLog";
import IncidentsLog from "./pages/IncidentsLog";
import User from "./pages/User";
import { LoginForm } from "./components/LoginForm";
import { useAuth } from "./lib/AuthProvider";

function Layout() {
    const { user, loading } = useAuth();
    if (loading) {
        return <div className="min-h-screen bg-background" />;
    }

    if (!user) {
        return <LoginForm />;
    }

    return (
        <>
            <main>
                <Outlet />
            </main>
            <Navbar />
        </>
    );
}

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/sleep-log" element={<SleepLog />} />
                <Route path="/consumption-log" element={<ConsumptionLog />} />
                <Route path="/incidents-log" element={<IncidentsLog />} />
                <Route path="/user" element={<User />} />
            </Route>
        </Routes>
    );
}
