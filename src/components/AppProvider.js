// src/app/components/AppProvider.js
'use client';
import { useState, createContext, useEffect, useContext } from 'react';
import Layout from './Layout';

// Crear contexto para compartir estado
export const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Estado del portfolio (ejemplo básico)
    const [portfolio, setPortfolio] = useState({
        total_balance: 93,
        paxg_balance: 42,
        eth_balance: 33,
        altcoin_balance: 18,
        premercado_balance: 0,
        distribution: [
            { name: 'PAXG', value: 42, percentage: 45 },
            { name: 'ETH', value: 33, percentage: 35 },
            { name: 'Altcoins', value: 18, percentage: 20 }
        ]
    });

    // Estado para operaciones activas
    const [activeOperations, setActiveOperations] = useState([]);

    // Estado para la configuración del sistema
    const [systemConfig, setSystemConfig] = useState({
        paxg_min_percentage: 40,
        eth_max_percentage: 40,
        altcoin_max_percentage: 20,
        max_drawdown_allowed: 25
    });

    // Efecto para cargar datos iniciales
    useEffect(() => {
        // En un MVP real, aquí se cargarían los datos desde la API
        // Por ahora usamos datos de ejemplo

        // Ejemplo de operaciones activas
        setActiveOperations([
            {
                id: 1,
                asset_name: 'ETH',
                strategy_type: 'ETH',
                entry_price: 1850,
                amount: 0.016,
                position_size: 29.6,
                stop_loss: 1760,
                take_profit_1: 1950,
                status: 'OPEN',
                entry_date: '2025-04-10T09:45:00',
                current_profit_loss: 2.5
            }
        ]);
    }, []);

    // Proporcionar los valores del contexto
    const contextValue = {
        portfolio,
        setPortfolio,
        activeOperations,
        setActiveOperations,
        systemConfig,
        setSystemConfig
    };

    return (
        <AppContext.Provider value={contextValue}>
            <Layout>{children}</Layout>
        </AppContext.Provider>
    );
}

// Hook personalizado para usar el contexto
export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext debe usarse dentro de un AppProvider');
    }
    return context;
}