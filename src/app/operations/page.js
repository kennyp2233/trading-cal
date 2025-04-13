// app/operations/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Filter, ArrowUpDown, Download, BarChart4 } from 'lucide-react';
import { useAppContext } from '../../components/AppProvider';

export default function OperationsPage() {
    const { allOperations, refreshOperations, loading: contextLoading, error: contextError } = useAppContext();

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

    // Cargar y procesar operaciones cuando cambian las dependencias
    useEffect(() => {
        const processOperations = async () => {
            try {
                setLoading(true);

                // Buscar operaciones desde el AppContext o directamente de la API
                let operationsData = [...allOperations];

                if (operationsData.length === 0 && !contextLoading) {
                    // Si no hay datos en el contexto, intentar cargarlos directamente
                    const response = await fetch(`/api/operations?status=${filter !== 'ALL' ? filter : ''}&sortBy=${sortBy}&sortDir=${sortDirection}`);
                    if (response.ok) {
                        operationsData = await response.json();
                    } else {
                        throw new Error('Error al cargar operaciones');
                    }
                }

                // Filtrar operaciones según el filtro actual
                let filteredOperations = operationsData;
                if (filter !== 'ALL') {
                    filteredOperations = operationsData.filter(op => op.status === filter);
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
                const closedOperations = operationsData.filter(op => op.status === 'CLOSED');
                const totalOps = closedOperations.length;
                const winningOps = closedOperations.filter(op => op.profit_loss_percentage > 0).length;
                const winRate = totalOps > 0 ? (winningOps / totalOps) * 100 : 0;

                const profitLossValues = closedOperations.map(op => op.profit_loss_percentage || 0);
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
            } catch (error) {
                console.error('Error procesando operaciones:', error);
            } finally {
                setLoading(false);
            }
        };

        processOperations();
    }, [filter, sortBy, sortDirection, allOperations, contextLoading]);

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

    // Manejar cierre de operación
    const handleCloseOperation = async (id) => {
        try {
            // Redirigir a una página dedicada para cerrar la operación
            // En un MVP completo, podríamos implementar un modal para esto
            alert(`Se redirigirá a una página para cerrar la operación ${id}`);
            // window.location.href = `/operations/close/${id}`;
        } catch (error) {
            console.error('Error al intentar cerrar operación:', error);
            alert('Error al intentar cerrar la operación');
        }
    };

    if (contextLoading || loading) {
        return <div className="p-6 flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando operaciones...</p>
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

                    <button
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={refreshOperations}
                    >
                        <BarChart4 size={14} className="mr-1" />
                        Actualizar
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
                                                <Link href={`/operations/${op.id}`} className="text-indigo-600 hover:text-indigo-900">Ver</Link>
                                                {op.status === 'OPEN' && (
                                                    <button
                                                        className="text-red-600 hover:text-red-900"
                                                        onClick={() => handleCloseOperation(op.id)}
                                                    >
                                                        Cerrar
                                                    </button>
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