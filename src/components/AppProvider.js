// src/components/AppProvider.js
'use client';
import { useState, createContext, useEffect, useContext } from 'react';
import Layout from './Layout';

// Crear contexto para compartir estado
export const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Estado del portfolio
    const [portfolio, setPortfolio] = useState({
        total_balance: 0,
        paxg_balance: 0,
        eth_balance: 0,
        altcoin_balance: 0,
        premercado_balance: 0,
        distribution: []
    });

    // Estado para operaciones activas
    const [activeOperations, setActiveOperations] = useState([]);

    // Estado para todas las operaciones
    const [allOperations, setAllOperations] = useState([]);

    // Estado para la configuración del sistema
    const [systemConfig, setSystemConfig] = useState({
        paxg_min_percentage: 40,
        eth_max_percentage: 40,
        altcoin_max_percentage: 20,
        max_drawdown_allowed: 25
    });

    // Estado para eventos de drawdown activos
    const [activeDrawdown, setActiveDrawdown] = useState(null);

    // Estado para historial de rotaciones
    const [rotationHistory, setRotationHistory] = useState([]);

    // Estado de carga global
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Cargar el portfolio
                const portfolioResponse = await fetch('/api/portfolio');
                if (portfolioResponse.ok) {
                    const portfolioData = await portfolioResponse.json();
                    setPortfolio(portfolioData);
                } else {
                    // Si no hay portfolio, inicializarlo con valores por defecto
                    if (portfolioResponse.status === 404) {
                        const initResponse = await fetch('/api/portfolio/init', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                total_balance: 93,
                                paxg_balance: 42,
                                eth_balance: 33,
                                altcoin_balance: 18
                            }),
                        });

                        if (initResponse.ok) {
                            const newPortfolio = await initResponse.json();
                            setPortfolio({
                                ...newPortfolio,
                                distribution: [
                                    { name: 'PAXG', value: 42, percentage: 45 },
                                    { name: 'ETH', value: 33, percentage: 35 },
                                    { name: 'Altcoins', value: 18, percentage: 20 }
                                ]
                            });
                        }
                    }
                }

                // Cargar operaciones activas
                const activeOpsResponse = await fetch('/api/operations?status=OPEN');
                if (activeOpsResponse.ok) {
                    const activeOpsData = await activeOpsResponse.json();
                    setActiveOperations(activeOpsData);
                }

                // Cargar todas las operaciones
                const allOpsResponse = await fetch('/api/operations');
                if (allOpsResponse.ok) {
                    const allOpsData = await allOpsResponse.json();
                    setAllOperations(allOpsData);
                }

                // Cargar configuración del sistema
                const configResponse = await fetch('/api/system-config');
                if (configResponse.ok) {
                    const configData = await configResponse.json();
                    setSystemConfig(configData);
                }

                // Cargar eventos de drawdown activos
                const drawdownResponse = await fetch('/api/drawdown?active=true&limit=1');
                if (drawdownResponse.ok) {
                    const drawdownData = await drawdownResponse.json();
                    if (drawdownData.length > 0) {
                        setActiveDrawdown(drawdownData[0]);
                    }
                }

                // Cargar historial de rotaciones
                const rotationsResponse = await fetch('/api/rotations?limit=5');
                if (rotationsResponse.ok) {
                    const rotationsData = await rotationsResponse.json();
                    setRotationHistory(rotationsData);
                }
            } catch (err) {
                console.error('Error al cargar datos iniciales:', err);
                setError('Error al cargar los datos del sistema. Inténtalo de nuevo más tarde.');

                // Configurar datos básicos de ejemplo para desarrollo
                setPortfolio({
                    total_balance: 93,
                    paxg_balance: 42,
                    eth_balance: 33,
                    altcoin_balance: 18,
                    distribution: [
                        { name: 'PAXG', value: 42, percentage: 45 },
                        { name: 'ETH', value: 33, percentage: 35 },
                        { name: 'Altcoins', value: 18, percentage: 20 }
                    ]
                });

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
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Función para actualizar operaciones
    const refreshOperations = async () => {
        try {
            // Actualizar operaciones activas
            const activeOpsResponse = await fetch('/api/operations?status=OPEN');
            if (activeOpsResponse.ok) {
                const activeOpsData = await activeOpsResponse.json();
                setActiveOperations(activeOpsData);
            }

            // Actualizar todas las operaciones
            const allOpsResponse = await fetch('/api/operations');
            if (allOpsResponse.ok) {
                const allOpsData = await allOpsResponse.json();
                setAllOperations(allOpsData);
            }
        } catch (err) {
            console.error('Error al actualizar operaciones:', err);
        }
    };

    // Función para actualizar portfolio
    const refreshPortfolio = async () => {
        try {
            const portfolioResponse = await fetch('/api/portfolio');
            if (portfolioResponse.ok) {
                const portfolioData = await portfolioResponse.json();
                setPortfolio(portfolioData);
            }
        } catch (err) {
            console.error('Error al actualizar portfolio:', err);
        }
    };

    // Función para actualizar rotaciones
    const refreshRotations = async () => {
        try {
            const rotationsResponse = await fetch('/api/rotations?limit=5');
            if (rotationsResponse.ok) {
                const rotationsData = await rotationsResponse.json();
                setRotationHistory(rotationsData);
            }
        } catch (err) {
            console.error('Error al actualizar rotaciones:', err);
        }
    };

    // Función para ejecutar una rotación
    const executeRotation = async (rotationData) => {
        try {
            const response = await fetch('/api/rotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rotationData),
            });

            if (!response.ok) {
                throw new Error('Error al ejecutar la rotación');
            }

            // Actualizar datos después de la rotación
            await refreshPortfolio();
            await refreshRotations();

            return await response.json();
        } catch (err) {
            console.error('Error al ejecutar rotación:', err);
            throw err;
        }
    };

    // Función para crear una operación
    const createOperation = async (operationData) => {
        try {
            const response = await fetch('/api/operations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(operationData),
            });

            if (!response.ok) {
                throw new Error('Error al crear la operación');
            }

            // Actualizar operaciones y portfolio
            await refreshOperations();
            await refreshPortfolio();

            return await response.json();
        } catch (err) {
            console.error('Error al crear operación:', err);
            throw err;
        }
    };

    // Función para cerrar una operación
    const closeOperation = async (id, closeData) => {
        try {
            const response = await fetch(`/api/operations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...closeData,
                    status: 'CLOSED',
                    exit_date: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Error al cerrar la operación');
            }

            // Actualizar operaciones y portfolio
            await refreshOperations();
            await refreshPortfolio();

            return await response.json();
        } catch (err) {
            console.error('Error al cerrar operación:', err);
            throw err;
        }
    };

    // Función para registrar un evento de drawdown
    const registerDrawdownEvent = async (drawdownData) => {
        try {
            const response = await fetch('/api/drawdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(drawdownData),
            });

            if (!response.ok) {
                throw new Error('Error al registrar evento de drawdown');
            }

            const newEvent = await response.json();
            setActiveDrawdown(newEvent);

            return newEvent;
        } catch (err) {
            console.error('Error al registrar drawdown:', err);
            throw err;
        }
    };

    // Función para cerrar un evento de drawdown
    const closeDrawdownEvent = async (id, closeData) => {
        try {
            const response = await fetch(`/api/drawdown/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...closeData,
                    end_date: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Error al cerrar evento de drawdown');
            }

            setActiveDrawdown(null);
            return await response.json();
        } catch (err) {
            console.error('Error al cerrar drawdown:', err);
            throw err;
        }
    };

    // Proporcionar los valores del contexto
    const contextValue = {
        // Estados
        portfolio,
        activeOperations,
        allOperations,
        systemConfig,
        activeDrawdown,
        rotationHistory,
        loading,
        error,

        // Funciones para actualizar datos
        refreshPortfolio,
        refreshOperations,
        refreshRotations,

        // Funciones para operaciones CRUD
        executeRotation,
        createOperation,
        closeOperation,
        registerDrawdownEvent,
        closeDrawdownEvent
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