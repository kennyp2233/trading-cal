// src/app/rotation/layout.js
import { AppProvider } from '../../components/AppProvider';

export default function RotationLayout({ children }) {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    );
}