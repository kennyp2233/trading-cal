// app/operations/new/page.js
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewOperationPage() {
    // Estado para el formulario de operación
    const [operation, setOperation] = useState({
        strategy_type: 'ETH',
        asset_name: '',
        entry_price: '',
        amount: '',
        stop_loss: '',
        take_profit_1: '',
        take_profit_2: '',
        take_profit_3: '',
        entry_reason: '',
        notes: ''
    });

    // Estado para los resultados de la calculadora
    const [calculatedValues, setCalculatedValues] = useState({
        position_size: 0,
        risk_amount: 0,
        risk_percentage: 0,
        reward_ratio_1: 0,
        reward_ratio_2: 0,
        reward_ratio_3: 0
    });

    // Estado para la validación de reglas del sistema
    const [validationResults, setValidationResults] = useState({
        isValid: true,
        messages: []
    });

    // Estado del balance del portfolio
    const [portfolio, setPortfolio] = useState({
        total_balance: 93,
        paxg_balance: 42,
        eth_balance: 33,
        altcoin_balance: 18
    });

    // Efectos para calcular valores automáticamente cuando cambian los inputs relevantes
    useEffect(() => {
        if (operation.entry_price && operation.stop_loss && operation.amount) {
            calculatePositionMetrics();
        }
    }, [operation.entry_price, operation.stop_loss, operation.amount, operation.take_profit_1, operation.take_profit_2, operation.take_profit_3]);

    // Efectos para validar reglas del sistema cuando cambia la operación
    useEffect(() => {
        validateSystemRules();
    }, [operation, calculatedValues]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let parsedValue = value;

        // Convertir valores numéricos
        if (['entry_price', 'amount', 'stop_loss', 'take_profit_1', 'take_profit_2', 'take_profit_3'].includes(name)) {
            parsedValue = value === '' ? '' : parseFloat(value);
        }

        setOperation({
            ...operation,
            [name]: parsedValue
        });
    };

    const calculatePositionMetrics = () => {
        const entryPrice = parseFloat(operation.entry_price);
        const stopLoss = parseFloat(operation.stop_loss);
        const amount = parseFloat(operation.amount);

        // Calcular el tamaño de la posición
        const positionSize = entryPrice * amount;

        // Calcular el riesgo
        const priceChange = Math.abs(entryPrice - stopLoss);
        const riskAmount = priceChange * amount;
        const riskPercentage = (riskAmount / positionSize) * 100;

        // Calcular ratios de recompensa si hay take profits establecidos
        let rewardRatio1 = 0;
        let rewardRatio2 = 0;
        let rewardRatio3 = 0;

        if (operation.take_profit_1) {
            const tp1Change = Math.abs(parseFloat(operation.take_profit_1) - entryPrice);
            rewardRatio1 = tp1Change / priceChange;
        }

        if (operation.take_profit_2) {
            const tp2Change = Math.abs(parseFloat(operation.take_profit_2) - entryPrice);
            rewardRatio2 = tp2Change / priceChange;
        }

        if (operation.take_profit_3) {
            const tp3Change = Math.abs(parseFloat(operation.take_profit_3) - entryPrice);
            rewardRatio3 = tp3Change / priceChange;
        }

        setCalculatedValues({
            position_size: positionSize,
            risk_amount: riskAmount,
            risk_percentage: riskPercentage,
            reward_ratio_1: rewardRatio1,
            reward_ratio_2: rewardRatio2,
            reward_ratio_3: rewardRatio3
        });
    };

    const validateSystemRules = () => {
        const messages = [];
        let isValid = true;

        // Verificar reglas de gestión de riesgo
        if (calculatedValues.risk_percentage > 5) {
            messages.push({
                type: 'warning',
                message: 'El riesgo por operación supera el 5% recomendado'
            });
            isValid = false;
        }

        // Verificar tamaño de posición dentro de límites de estrategia
        if (operation.strategy_type === 'ETH' && calculatedValues.position_size > portfolio.eth_balance) {
            messages.push({
                type: 'error',
                message: 'El tamaño de posición supera el balance disponible para ETH'
            });
            isValid = false;
        }

        if (operation.strategy_type === 'ALTCOIN' && calculatedValues.position_size > portfolio.altcoin_balance) {
            messages.push({
                type: 'error',
                message: 'El tamaño de posición supera el balance disponible para Altcoins'
            });
            isValid = false;
        }

        // Verificar ratio riesgo/recompensa
        if (operation.take_profit_1 && calculatedValues.reward_ratio_1 < 2) {
            messages.push({
                type: 'warning',
                message: 'La relación riesgo/recompensa (TP1) es menor a 2:1'
            });
            isValid = false;
        }

        // Verificar reglas específicas por estrategia
        if (operation.strategy_type === 'ALTCOIN') {
            const altcoinMaxPercentage = (calculatedValues.position_size / portfolio.total_balance) * 100;

            if (altcoinMaxPercentage > 10) {
                messages.push({
                    type: 'warning',
                    message: 'Esta operación representa más del 10% del capital total en una altcoin'
                });
                isValid = false;
            }
        }

        setValidationResults({
            isValid,
            messages
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validationResults.isValid) {
            const proceed = confirm('Esta operación no cumple con algunas reglas del sistema. ¿Deseas continuar de todos modos?');
            if (!proceed) return;
        }

        try {
            // En producción: Enviar a API
            const response = await fetch('/api/operations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...operation,
                    position_size: calculatedValues.position_size,
                    status: 'OPEN',
                    entry_date: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Error al guardar la operación');
            }

            alert('Operación registrada con éxito');
            // Redireccionar o limpiar formulario
            setOperation({
                strategy_type: 'ETH',
                asset_name: '',
                entry_price: '',
                amount: '',
                stop_loss: '',
                take_profit_1: '',
                take_profit_2: '',
                take_profit_3: '',
                entry_reason: '',
                notes: ''
            });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center mb-6">
                <Link href="/operations" className="flex items-center text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon size={16} className="mr-1" /> Volver a Operaciones
                </Link>
                <h1 className="text-2xl font-bold ml-6">Nueva Operación</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulario principal */}
                <div className="col-span-2 bg-white rounded-lg shadow p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estrategia
                                </label>
                                <select
                                    name="strategy_type"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.strategy_type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="ETH">ETH (Swing)</option>
                                    <option value="ALTCOIN">ALTCOIN (Trading Agresivo)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Activo / Token
                                </label>
                                <input
                                    type="text"
                                    name="asset_name"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.asset_name}
                                    onChange={handleInputChange}
                                    placeholder="ETH, BTC, SHIB, etc."
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio de Entrada
                                </label>
                                <input
                                    type="number"
                                    name="entry_price"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.entry_price}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 1800"
                                    step="any"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.amount}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 0.1"
                                    step="any"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stop Loss
                                </label>
                                <input
                                    type="number"
                                    name="stop_loss"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.stop_loss}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 1710"
                                    step="any"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Take Profit 1
                                </label>
                                <input
                                    type="number"
                                    name="take_profit_1"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.take_profit_1}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 1900"
                                    step="any"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Take Profit 2
                                </label>
                                <input
                                    type="number"
                                    name="take_profit_2"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.take_profit_2}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 2000"
                                    step="any"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Take Profit 3
                                </label>
                                <input
                                    type="number"
                                    name="take_profit_3"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={operation.take_profit_3}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 2100"
                                    step="any"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razón de Entrada
                            </label>
                            <textarea
                                name="entry_reason"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={operation.entry_reason}
                                onChange={handleInputChange}
                                placeholder="Describe tu razón de entrada (setup técnico, catalizador, etc.)"
                                rows="2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas Adicionales
                            </label>
                            <textarea
                                name="notes"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={operation.notes}
                                onChange={handleInputChange}
                                placeholder="Notas adicionales o consideraciones específicas"
                                rows="2"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                                disabled={!operation.entry_price || !operation.amount || !operation.stop_loss}
                            >
                                Registrar Operación
                            </button>
                        </div>
                    </form>
                </div>

                {/* Panel lateral de información y cálculos */}
                <div className="space-y-6">
                    {/* Calculadora de posición */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center mb-3">
                            <Calculator size={18} className="text-indigo-600 mr-2" />
                            <h3 className="text-lg font-semibold">Calculadora de Posición</h3>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Tamaño de Posición:</div>
                                <div className="p-2 bg-gray-100 rounded font-mono">
                                    ${calculatedValues.position_size.toFixed(2)}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Monto en Riesgo:</div>
                                <div className="p-2 bg-gray-100 rounded font-mono">
                                    ${calculatedValues.risk_amount.toFixed(2)} ({calculatedValues.risk_percentage.toFixed(2)}%)
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Ratio Riesgo/Recompensa:</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {operation.take_profit_1 && (
                                        <div className="p-2 bg-gray-100 rounded text-center">
                                            <div className="text-xs text-gray-500">TP1</div>
                                            <div className="font-mono">1:{calculatedValues.reward_ratio_1.toFixed(1)}</div>
                                        </div>
                                    )}

                                    {operation.take_profit_2 && (
                                        <div className="p-2 bg-gray-100 rounded text-center">
                                            <div className="text-xs text-gray-500">TP2</div>
                                            <div className="font-mono">1:{calculatedValues.reward_ratio_2.toFixed(1)}</div>
                                        </div>
                                    )}

                                    {operation.take_profit_3 && (
                                        <div className="p-2 bg-gray-100 rounded text-center">
                                            <div className="text-xs text-gray-500">TP3</div>
                                            <div className="font-mono">1:{calculatedValues.reward_ratio_3.toFixed(1)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validación de reglas del sistema */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-3">Validación del Sistema</h3>

                        {validationResults.messages.length === 0 ? (
                            <div className="flex items-center p-3 bg-green-50 rounded border border-green-100">
                                <CheckCircle size={18} className="text-green-500 mr-2" />
                                <span className="text-green-700">Operación cumple con las reglas del sistema</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {validationResults.messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start p-3 rounded border ${msg.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
                                            }`}
                                    >
                                        <AlertTriangle
                                            size={18}
                                            className={`${msg.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                                                } mr-2 mt-0.5`}
                                        />
                                        <span className={msg.type === 'error' ? 'text-red-700' : 'text-yellow-700'}>
                                            {msg.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Guía rápida de la estrategia */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-3">
                            Guía Rápida: {operation.strategy_type === 'ETH' ? 'Swing con ETH' : 'Trading Agresivo'}
                        </h3>

                        {operation.strategy_type === 'ETH' ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</div>
                                    <p>Max. 5 días en posición</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</div>
                                    <p>SL de 3-5%, TP escalonado (8%, 12%, 15%)</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</div>
                                    <p>Cerrar posición si pierde soporte estructural</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">4</div>
                                    <p>No tocar PAXG mientras hay trade activo</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</div>
                                    <p>Máx. 15% del capital total</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</div>
                                    <p>Máx. 2 trades por día</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</div>
                                    <p>TP parcial en 10-20%, luego trailing stop</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">4</div>
                                    <p>Si no sube en 1-2 horas, salir</p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">5</div>
                                    <p>Si ganás +20%, retirar 50% a USDT o PAXG</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}