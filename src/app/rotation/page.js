// app/rotation/page.js
'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../components/AppProvider';

export default function RotationPage() {
    const {
        portfolio,
        rotationHistory,
        executeRotation,
        refreshRotations,
        refreshPortfolio,
        loading: contextLoading,
        error: contextError
    } = useAppContext();

    const [fromStrategy, setFromStrategy] = useState('ETH');
    const [toStrategy, setToStrategy] = useState('PAXG');
    const [percentage, setPercentage] = useState(10);
    const [conditionText, setConditionText] = useState('');
    const [rotationAmount, setRotationAmount] = useState(0);
    const [resultingDistribution, setResultingDistribution] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Reglas de rotación predefinidas
    const [rotationRules] = useState([
        {
            id: 1,
            condition: 'ETH rompe resistencia clave con volumen',
            fromStrategy: 'PAXG',
            toStrategy: 'ETH',
            percentage: 10,
            description: 'Incrementar exposición en ETH cuando muestra fuerza técnica.'
        },
        {
            id: 2,
            condition: 'ETH rechaza soporte clave 2 veces',
            fromStrategy: 'ETH',
            toStrategy: 'PAXG',
            percentage: 15,
            description: 'Proteger capital reduciendo exposición en ETH cuando hay debilidad.'
        },
        {
            id: 3,
            condition: 'Altcoin genera +25%',
            fromStrategy: 'ALTCOIN',
            toStrategy: 'ETH/PAXG',
            percentage: 8,
            description: 'Tomar ganancias y distribuir entre ETH y PAXG.'
        },
        {
            id: 4,
            condition: 'Mercado general en tendencia bajista (ETH -15% semanal)',
            fromStrategy: 'ETH',
            toStrategy: 'PAXG',
            percentage: 20,
            description: 'Incrementar protección en PAXG durante mercados bajistas.'
        },
        {
            id: 5,
            condition: 'Setup premium en altcoin con catalizador',
            fromStrategy: 'PAXG',
            toStrategy: 'ALTCOIN',
            percentage: 5,
            description: 'Tomar riesgo calculado en altcoin con catalizador específico.'
        },
        {
            id: 6,
            condition: 'PAXG sube +3% vs USD',
            fromStrategy: 'PAXG',
            toStrategy: 'ETH',
            percentage: 8,
            description: 'Aprovechar ganancias en PAXG para rotar a ETH.'
        }
    ]);

    // Calcular rotación cuando cambian los inputs
    useEffect(() => {
        calculateRotation();
    }, [fromStrategy, toStrategy, percentage, portfolio]);

    const calculateRotation = () => {
        if (!portfolio || !portfolio.paxg_balance) return;

        const fromBalance = getBalanceByStrategy(fromStrategy);
        const amount = (fromBalance * percentage) / 100;

        setRotationAmount(amount);

        // Calcular nueva distribución
        const newDistribution = {
            total_balance: portfolio.total_balance,
            paxg_balance: portfolio.paxg_balance,
            eth_balance: portfolio.eth_balance,
            altcoin_balance: portfolio.altcoin_balance,
            premercado_balance: portfolio.premercado_balance || 0
        };

        // Restar del origen
        newDistribution[`${fromStrategy.toLowerCase()}_balance`] -= amount;

        if (toStrategy === 'ETH/PAXG') {
            // Distribuir 50/50 entre ETH y PAXG
            newDistribution.eth_balance += amount * 0.5;
            newDistribution.paxg_balance += amount * 0.5;
        } else {
            newDistribution[`${toStrategy.toLowerCase()}_balance`] += amount;
        }

        setResultingDistribution(newDistribution);
    };

    const getBalanceByStrategy = (strategy) => {
        if (!portfolio) return 0;
        switch (strategy) {
            case 'PAXG': return portfolio.paxg_balance;
            case 'ETH': return portfolio.eth_balance;
            case 'ALTCOIN': return portfolio.altcoin_balance;
            default: return 0;
        }
    };

    const handleRotationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Preparar datos para la rotación
            const rotationData = {
                from_strategy: fromStrategy,
                to_strategy: toStrategy,
                amount: rotationAmount,
                percentage_of_origin: percentage,
                trigger_condition: conditionText,
                notes: ''
            };

            // Ejecutar la rotación a través del contexto
            await executeRotation(rotationData);

            // Mostrar mensaje de éxito
            setSuccess('Rotación registrada con éxito');

            // Actualizar datos
            await refreshPortfolio();
            await refreshRotations();

            // Limpiar formulario
            setPercentage(10);
            setConditionText('');
        } catch (error) {
            console.error('Error al ejecutar rotación:', error);
            setError(`Error: ${error.message || 'No se pudo completar la rotación'}`);
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading) {
        return <div className="p-6 flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos del sistema...</p>
            </div>
        </div>;
    }

    if (contextError) {
        return <div className="p-6 bg-red-50 text-red-700 rounded-lg">
            Error: {contextError}. Por favor, recarga la página o contacta soporte.
        </div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Sistema de Rotación de Estrategias</h1>

            {/* Alertas */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
                    <AlertCircle size={18} className="mr-2 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                    {success}
                </div>
            )}

            {/* Matriz de Decisión */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">Matriz de Decisión Dinámica</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condición</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hacia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rotationRules.map((rule) => (
                                <tr key={rule.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{rule.condition}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs ${rule.fromStrategy === 'PAXG' ? 'bg-yellow-100 text-yellow-800' :
                                            rule.fromStrategy === 'ETH' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                            {rule.fromStrategy}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs ${rule.toStrategy === 'PAXG' ? 'bg-yellow-100 text-yellow-800' :
                                            rule.toStrategy === 'ETH' ? 'bg-blue-100 text-blue-800' :
                                                rule.toStrategy === 'ETH/PAXG' ? 'bg-green-100 text-green-800' :
                                                    'bg-purple-100 text-purple-800'
                                            }`}>
                                            {rule.toStrategy}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{rule.percentage}%</td>
                                    <td className="px-6 py-4 text-sm">{rule.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            className="text-indigo-600 hover:text-indigo-900"
                                            onClick={() => {
                                                setFromStrategy(rule.fromStrategy);
                                                setToStrategy(rule.toStrategy);
                                                setPercentage(rule.percentage);
                                                setConditionText(rule.condition);
                                            }}
                                        >
                                            Aplicar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Calculadora de Rotación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Calculadora de Rotación</h2>

                    <form onSubmit={handleRotationSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condición/Razón de la rotación
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={conditionText}
                                onChange={(e) => setConditionText(e.target.value)}
                                placeholder="Ej: ETH rechaza soporte clave"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Desde
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={fromStrategy}
                                    onChange={(e) => setFromStrategy(e.target.value)}
                                >
                                    <option value="PAXG">PAXG</option>
                                    <option value="ETH">ETH</option>
                                    <option value="ALTCOIN">ALTCOIN</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hacia
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={toStrategy}
                                    onChange={(e) => setToStrategy(e.target.value)}
                                >
                                    <option value="PAXG">PAXG</option>
                                    <option value="ETH">ETH</option>
                                    <option value="ALTCOIN">ALTCOIN</option>
                                    <option value="ETH/PAXG">ETH/PAXG (50/50)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Porcentaje
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded"
                                        min="1"
                                        max="100"
                                        value={percentage}
                                        onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
                                        required
                                    />
                                    <span className="ml-2">%</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monto a rotar
                            </label>
                            <div className="p-2 bg-gray-100 rounded font-mono">
                                ${rotationAmount.toFixed(2)}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : 'Ejecutar Rotación'}
                        </button>
                    </form>
                </div>

                {/* Visualización de Resultados */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Resultados de la Rotación</h2>

                    <div className="mb-6">
                        <h3 className="text-md font-medium mb-2">Distribución Actual</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                <div className="text-sm text-yellow-800">PAXG</div>
                                <div className="font-bold">${portfolio?.paxg_balance?.toFixed(2) || '0.00'}</div>
                                <div className="text-xs text-gray-500">
                                    {portfolio?.total_balance ? ((portfolio.paxg_balance / portfolio.total_balance) * 100).toFixed(1) : 0}%
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <div className="text-sm text-blue-800">ETH</div>
                                <div className="font-bold">${portfolio?.eth_balance?.toFixed(2) || '0.00'}</div>
                                <div className="text-xs text-gray-500">
                                    {portfolio?.total_balance ? ((portfolio.eth_balance / portfolio.total_balance) * 100).toFixed(1) : 0}%
                                </div>
                            </div>

                            <div className="bg-purple-50 p-3 rounded border border-purple-100">
                                <div className="text-sm text-purple-800">ALTCOIN</div>
                                <div className="font-bold">${portfolio?.altcoin_balance?.toFixed(2) || '0.00'}</div>
                                <div className="text-xs text-gray-500">
                                    {portfolio?.total_balance ? ((portfolio.altcoin_balance / portfolio.total_balance) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {Object.keys(resultingDistribution).length > 0 && (
                        <>
                            <div className="text-center my-4">
                                <ArrowRight className="inline-block" size={24} />
                            </div>

                            <h3 className="text-md font-medium mb-2">Después de la Rotación</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                    <div className="text-sm text-yellow-800">PAXG</div>
                                    <div className="font-bold">${resultingDistribution.paxg_balance.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">
                                        {((resultingDistribution.paxg_balance / portfolio.total_balance) * 100).toFixed(1)}%
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                    <div className="text-sm text-blue-800">ETH</div>
                                    <div className="font-bold">${resultingDistribution.eth_balance.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">
                                        {((resultingDistribution.eth_balance / portfolio.total_balance) * 100).toFixed(1)}%
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-3 rounded border border-purple-100">
                                    <div className="text-sm text-purple-800">ALTCOIN</div>
                                    <div className="font-bold">${resultingDistribution.altcoin_balance.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">
                                        {((resultingDistribution.altcoin_balance / portfolio.total_balance) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <div className="font-medium">Verificación de reglas de sistema:</div>
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {resultingDistribution.paxg_balance / portfolio.total_balance < 0.4 ? (
                                            <li className="text-red-500">⚠️ PAXG por debajo del mínimo recomendado (40%)</li>
                                        ) : (
                                            <li className="text-green-500">✓ PAXG dentro de los parámetros recomendados</li>
                                        )}

                                        {resultingDistribution.altcoin_balance / portfolio.total_balance > 0.2 ? (
                                            <li className="text-red-500">⚠️ Altcoins exceden el máximo recomendado (20%)</li>
                                        ) : (
                                            <li className="text-green-500">✓ Exposición a Altcoins dentro de límites seguros</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Historial de Rotaciones */}
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Historial de Rotaciones</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hacia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condición</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rotationHistory && rotationHistory.length > 0 ? (
                                rotationHistory.map((rotation) => (
                                    <tr key={rotation.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(rotation.rotation_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${rotation.from_strategy === 'PAXG' ? 'bg-yellow-100 text-yellow-800' :
                                                    rotation.from_strategy === 'ETH' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-purple-100 text-purple-800'
                                                }`}>
                                                {rotation.from_strategy}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${rotation.to_strategy === 'PAXG' ? 'bg-yellow-100 text-yellow-800' :
                                                    rotation.to_strategy === 'ETH' ? 'bg-blue-100 text-blue-800' :
                                                        rotation.to_strategy === 'ETH/PAXG' ? 'bg-green-100 text-green-800' :
                                                            'bg-purple-100 text-purple-800'
                                                }`}>
                                                {rotation.to_strategy}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">${rotation.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{rotation.percentage_of_origin}%</td>
                                        <td className="px-6 py-4">{rotation.trigger_condition}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No hay rotaciones registradas aún
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}