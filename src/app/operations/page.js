// app/operations/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Filter, ArrowUpDown, Download, BarChart4 } from 'lucide-react';

export default function OperationsPage() {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [stats, setStats] = useState({
        totalOperations: 0,
        winRate: 0,
        avgProfitLoss: 0,
        bestTrade: 0,
        worstTrade: 0
    });

    useEffect(() => {
        // Fetch operations data
        const fetchOperations = async () => {
            try {
                setLoading(true);

                // En producción: Esta sería una llamada a tu API
                // const response = await fetch(`/api/operations?filter=${filter}&sort=${sortBy}&direction=${sortDirection}`);
                // const data = await response.json();
                // setOperations(data);

                // Para desarrollo, usamos datos de ejemplo
                setTimeout(() => {
                    const sampleOperations = [
                        {
                            id: 1,
                            asset_name: 'ETH',
                            strategy_type: 'ETH',
                            entry_price: 1800,
                            exit_price: 1920,
                            amount: 0.018,
                            position_size: 32.4,
                            stop_loss: 1710,
                            take_profit_1: 1910,
                            status: 'CLOSED',
                            entry_date: '2025-04-01T14:30:00',
                            exit_date: '2025-04-03T10:15:00',
                            profit_loss: 2.16,
                            profit_loss_percentage: 6.67,
                            entry_reason: 'Pullback a EMA 20 en tendencia alcista',
                            exit_reason: 'Toma de ganancias en TP1'
                        },
                        {
                            id: 2,
                            asset_name: 'SHIB',
                            strategy_type: 'ALTCOIN',
                            entry_price: 0.00002,
                            exit_price: 0.000018,
                            amount: 400000,
                            position_size: 8,
                            stop_loss: 0.000018,
                            take_profit_1: 0.000023,
                            status: 'CLOSED',
                            entry_date: '2025-04-05T10:15:00',
                            exit_date: '2025-04-05T14:30:00',
                            profit_loss: -0.8,
                            profit_loss_percentage: -10,
                            entry_reason: 'Rebote en soporte con volumen creciente',
                            exit_reason: 'Stop loss activado'
                        },
                        {
                            id: 3,
                            asset_name: 'ETH',
                            strategy_type: 'ETH',
                            entry_price: 1850,
                            exit_price: null,
                            amount: 0.016,
                            position_size: 29.6,
                            stop_loss: 1760,
                            take_profit_1: 1950,
                            status: 'OPEN',
                            entry_date: '2025-04-10T09:45:00',
                            exit_date: null,
                            profit_loss: null,
                            profit_loss_percentage: null,
                            entry_reason: 'Rompimiento de resistencia con incremento de volumen',
                            exit_reason: null
                        },
                        {
                            id: 4,
                            asset_name: 'ADA',
                            strategy_type: 'ALTCOIN',
                            entry_price: 0.45,
                            exit_price: 0.52,
                            amount: 200,
                            position_size: 90,
                            stop_loss: 0.42,
                            take_profit_1: 0.50,
                            status: 'CLOSED',
                            entry_date: '2025-03-28T11:20:00',
                            exit_date: '2025-03-30T16:45:00',
                            profit_loss: 14,
                            profit_loss_percentage: 15.56,
                            entry_reason: 'Listado en nuevo exchange con aumento de liquidez',
                            exit_reason: 'Toma de ganancias parcial en TP1 y trailing stop para el resto'
                        }
                    ];

                    // Filtrar operaciones según el filtro actual
                    let filteredOperations = sampleOperations;
                    if (filter !== 'ALL') {
                        filteredOperations = sampleOperations.filter(op => op.status === filter);
                    }

                    // Ordenar operaciones
                    filteredOperations.sort((a, b) => {
                        if (sortBy === 'date') {
                            const dateA = new Date(a.entry_date);
                            const dateB = new Date(b.entry_date);
                            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                        } else if (sortBy === 'profit') {
                            const profitA = a.profit_loss_percentage || 0;
                            const profitB = b.profit_loss_percentage || 0;
                            return sortDirection === 'asc' ? profitA - profitB : profitB - profitA;
                        }
                        return 0;
                    });

                    setOperations(filteredOperations);

                    // Calcular estadísticas
                    const closedOperations = sampleOperations.filter(op => op.status === 'CLOSED');
                    const totalOps = closedOperations.length;
                    const winningOps = closedOperations.filter(op => op.profit_loss_percentage > 0).length;
                    const winRate = totalOps > 0 ? (winningOps / totalOps) * 100 : 0;

                    const profitLossValues = closedOperations.map(op => op.profit_loss_percentage);
                    const avgProfitLoss = profitLossValues.length > 0
                        ? profitLossValues.reduce((sum, val) => sum + val, 0) / profitLossValues.length
                        : 0;

                    const bestTrade = profitLossValues.length > 0 ? Math.max(...profitLossValues) : 0;
                    const worstTrade = profitLossValues.length > 0 ? Math.min(...profitLossValues) : 0;

                    setStats({
                        totalOperations: totalOps,
                        winRate,
                        avgProfitLoss,
                        bestTrade,
                        worstTrade
                    });

                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching operations:', error);
                setLoading(false);
            }
        };

        fetchOperations();
    }, [filter, sortBy, sortDirection]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('desc');
        }
    };

    const exportToCSV = () => {
        // Implementación básica de exportación a CSV
        const headers = [
            'ID', 'Activo', 'Estrategia', 'Entrada', 'Salida', 'Cantidad',
            'Tamaño', 'SL', 'TP1', 'Estado', 'Fecha Entrada', 'Fecha Salida',
            'P&L', 'P&L %', 'Razón Entrada', 'Razón Salida'
        ];

        const csvData = operations.map(op => [
            op.id,
            op.asset_name,
            op.strategy_type,
            op.entry_price,
            op.exit_price || '',
            op.amount,
            op.position_size,
            op.stop_loss,
            op.take_profit_1,
            op.status,
            new Date(op.entry_date).toLocaleDateString(),
            op.exit_date ? new Date(op.exit_date).toLocaleDateString() : '',
            op.profit_loss || '',
            op.profit_loss_percentage ? `${op.profit_loss_percentage}%` : '',
            op.entry_reason,
            op.exit_reason || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'trading_operations.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Operaciones de Trading</h1>

                <Link
                    href="/operations/new"
                    className="flex items-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                    <PlusCircle size={18} className="mr-1" /> Nueva Operación
                </Link>
            </div>

            {/* Estadísticas resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">Total Operaciones</div>
                    <div className="text-2xl font-bold">{stats.totalOperations}</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">Win Rate</div>
                    <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">Promedio P&L</div>
                    <div className={`text-2xl font-bold ${stats.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.avgProfitLoss >= 0 ? '+' : ''}{stats.avgProfitLoss.toFixed(2)}%
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">Mejor Trade</div>
                    <div className="text-2xl font-bold text-green-600">+{stats.bestTrade.toFixed(2)}%</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">Peor Trade</div>
                    <div className="text-2xl font-bold text-red-600">{stats.worstTrade.toFixed(2)}%</div>
                </div>
            </div>

            {/* Controles de filtro y ordenamiento */}
            <div className="flex flex-wrap justify-between items-center mb-4 bg-white rounded-lg shadow p-3">
                <div className="flex space-x-2 mb-2 sm:mb-0">
                    <div className="flex items-center">
                        <Filter size={16} className="text-gray-500 mr-1" />
                        <span className="text-sm text-gray-600 mr-2">Filtrar:</span>
                    </div>

                    <button
                        className={`px-2 py-1 text-sm rounded ${filter === 'ALL' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => handleFilterChange('ALL')}
                    >
                        Todas
                    </button>

                    <button
                        className={`px-2 py-1 text-sm rounded ${filter === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => handleFilterChange('OPEN')}
                    >
                        Abiertas
                    </button>

                    <button
                        className={`px-2 py-1 text-sm rounded ${filter === 'CLOSED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => handleFilterChange('CLOSED')}
                    >
                        Cerradas
                    </button>
                </div>

                <div className="flex space-x-2">
                    <button
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => handleSortChange('date')}
                    >
                        <ArrowUpDown size={14} className="mr-1" />
                        Fecha {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>

                    <button
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => handleSortChange('profit')}
                    >
                        <ArrowUpDown size={14} className="mr-1" />
                        P&L {sortBy === 'profit' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>

                    <button
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={exportToCSV}
                    >
                        <Download size={14} className="mr-1" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Tabla de operaciones */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando operaciones...</div>
                ) : operations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay operaciones que coincidan con los filtros seleccionados
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estrategia</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL/TP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {operations.map((op) => (
                                    <tr key={op.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium">{op.asset_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${op.strategy_type === 'ETH' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {op.strategy_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>${op.entry_price}</div>
                                            <div className="text-xs text-gray-500">{new Date(op.entry_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {op.exit_price ? (
                                                <>
                                                    <div>${op.exit_price}</div>
                                                    <div className="text-xs text-gray-500">{new Date(op.exit_date).toLocaleDateString()}</div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>${op.position_size}</div>
                                            <div className="text-xs text-gray-500">{op.amount} {op.asset_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-red-500">SL: ${op.stop_loss}</div>
                                            <div className="text-green-500">TP: ${op.take_profit_1}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {op.profit_loss_percentage !== null ? (
                                                <span className={op.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {op.profit_loss_percentage >= 0 ? '+' : ''}{op.profit_loss_percentage}%
                                                    <div className="text-xs">
                                                        ${op.profit_loss >= 0 ? '+' : ''}{op.profit_loss}
                                                    </div>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(op.entry_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${op.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {op.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button className="text-indigo-600 hover:text-indigo-900">Ver</button>
                                                {op.status === 'OPEN' && (
                                                    <button className="text-red-600 hover:text-red-900">Cerrar</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}