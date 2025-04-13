// src/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../components/AppProvider'; // Asegúrate de que la ruta sea correcta

export default function Dashboard() {
    const { portfolio, activeOperations } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Simular carga de datos (para el MVP nos basamos en los datos del contexto)
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    // Colores para el gráfico de distribución
    const COLORS = ['#FFD700', '#5636D6', '#FF6B6B'];

    if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard de Trading</h1>

            {/* Sistema de Alerta de Salud */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <h2 className="text-lg font-semibold text-green-700">Sistema en buen estado</h2>
                </div>
                <p className="text-green-600 mt-1">Distribución de capital dentro de los parámetros. Sin eventos de drawdown activos.</p>
            </div>

            {/* Distribución de Cartera */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="col-span-2 bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Distribución de Capital</h2>
                    <div className="flex items-center">
                        <div className="w-52 h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={portfolio.distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                                    >
                                        {portfolio.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-4">
                            <div className="font-bold text-2xl mb-2">${portfolio.total_balance}</div>
                            <div className="grid grid-cols-1 gap-2">
                                {portfolio.distribution.map((item, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                                        <div>{item.name}: ${item.value} ({item.percentage}%)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Métricas Rápidas */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Métricas Rápidas</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                                <div className="text-gray-500 text-sm">ETH (30d)</div>
                                <div className="font-semibold">+12.3%</div>
                            </div>
                            <ArrowUpRight className="text-green-500" size={20} />
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                                <div className="text-gray-500 text-sm">Altcoins (30d)</div>
                                <div className="font-semibold">-5.2%</div>
                            </div>
                            <ArrowDownRight className="text-red-500" size={20} />
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                                <div className="text-gray-500 text-sm">Win Rate</div>
                                <div className="font-semibold">68%</div>
                            </div>
                            <Activity className="text-blue-500" size={20} />
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                                <div className="text-gray-500 text-sm">Drawdown Actual</div>
                                <div className="font-semibold">3.2%</div>
                            </div>
                            <AlertTriangle className="text-yellow-500" size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Operaciones Activas */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">Operaciones Activas</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estrategia</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TP1</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {activeOperations.map((op) => (
                                <tr key={op.id}>
                                    <td className="py-2 px-3 whitespace-nowrap">{op.asset_name}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs ${op.strategy_type === 'ETH' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {op.strategy_type}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">${op.entry_price}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">${op.position_size}</td>
                                    <td className="py-2 px-3 whitespace-nowrap text-red-500">${op.stop_loss}</td>
                                    <td className="py-2 px-3 whitespace-nowrap text-green-500">${op.take_profit_1}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        <span className={op.current_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {op.current_profit_loss >= 0 ? '+' : ''}{op.current_profit_loss}%
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(op.entry_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap text-sm">
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-2">Editar</button>
                                        <button className="text-red-600 hover:text-red-900">Cerrar</button>
                                    </td>
                                </tr>
                            ))}
                            {activeOperations.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="py-4 text-center text-gray-500">
                                        No hay operaciones activas en este momento
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recordatorio de Sistema de Rotación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">Próxima Rotación Recomendada</h3>
                <p className="text-blue-600">ETH ha rechazado el soporte clave dos veces. Considera rotar 15% de ETH a PAXG.</p>
                <button className="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm">
                    Ejecutar Rotación
                </button>
            </div>
        </div>
    );
}