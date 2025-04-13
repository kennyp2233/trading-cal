// src/app/dashboard/layout.js
import { AppProvider } from "../../components/AppProvider";

export default function DashboardLayout({ children }) {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    );
}