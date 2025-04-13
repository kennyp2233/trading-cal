// src/app/operations/layout.js
import { AppProvider } from '../../components/AppProvider';

export default function OperationsLayout({ children }) {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    );
}