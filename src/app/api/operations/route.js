// app/api/operations/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/operations - Obtener operaciones
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const sortBy = searchParams.get('sortBy') || 'entry_date';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const db = await getDb();

        let query = 'SELECT * FROM operations';
        const params = [];

        // Aplicar filtros
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        // Aplicar ordenamiento
        query += ` ORDER BY ${sortBy} ${sortDir}`;

        const operations = await db.all(query, params);

        return NextResponse.json(operations);
    } catch (error) {
        console.error('Error al obtener operaciones:', error);
        return NextResponse.json(
            { error: 'Error al obtener operaciones' },
            { status: 500 }
        );
    }
}

// POST /api/operations - Crear una nueva operación
export async function POST(request) {
    try {
        const operationData = await request.json();

        // Validar datos mínimos requeridos
        if (!operationData.strategy_type || !operationData.asset_name ||
            !operationData.entry_price || !operationData.amount) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Preparar datos para inserción
        const {
            strategy_type,
            asset_name,
            operation_type = 'BUY',
            entry_price,
            exit_price = null,
            amount,
            position_size,
            stop_loss,
            take_profit_1,
            take_profit_2 = null,
            take_profit_3 = null,
            status = 'OPEN',
            entry_reason = null,
            exit_reason = null,
            profit_loss = null,
            profit_loss_percentage = null,
            entry_date = new Date().toISOString(),
            exit_date = null,
            notes = null
        } = operationData;

        // Insertar en la base de datos
        const result = await db.run(`
      INSERT INTO operations (
        strategy_type, asset_name, operation_type, entry_price, exit_price,
        amount, position_size, stop_loss, take_profit_1, take_profit_2,
        take_profit_3, status, entry_reason, exit_reason, profit_loss,
        profit_loss_percentage, entry_date, exit_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            strategy_type, asset_name, operation_type, entry_price, exit_price,
            amount, position_size, stop_loss, take_profit_1, take_profit_2,
            take_profit_3, status, entry_reason, exit_reason, profit_loss,
            profit_loss_percentage, entry_date, exit_date, notes
        ]);

        // Obtener la operación recién creada
        const newOperation = await db.get('SELECT * FROM operations WHERE id = ?', result.lastID);

        // Actualizar balance según la estrategia
        await updateBalanceForOperation(db, strategy_type, position_size, 'subtract');

        return NextResponse.json(newOperation, { status: 201 });
    } catch (error) {
        console.error('Error al crear operación:', error);
        return NextResponse.json(
            { error: 'Error al crear operación' },
            { status: 500 }
        );
    }
}

// PATCH /api/operations - Actualizar una operación existente (para cerrar operaciones)
export async function PATCH(request) {
    try {
        const operationData = await request.json();

        if (!operationData.id) {
            return NextResponse.json(
                { error: 'Se requiere el ID de la operación' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Obtener la operación actual
        const currentOperation = await db.get('SELECT * FROM operations WHERE id = ?', operationData.id);

        if (!currentOperation) {
            return NextResponse.json(
                { error: 'Operación no encontrada' },
                { status: 404 }
            );
        }

        // Solo permitir actualizar operaciones abiertas
        if (currentOperation.status !== 'OPEN' && operationData.status === 'CLOSED') {
            return NextResponse.json(
                { error: 'Solo se pueden cerrar operaciones abiertas' },
                { status: 400 }
            );
        }

        // Preparar datos para actualización
        const updates = [];
        const params = [];

        // Campos que se pueden actualizar
        const updatableFields = [
            'exit_price', 'status', 'exit_reason', 'profit_loss',
            'profit_loss_percentage', 'exit_date', 'notes'
        ];

        updatableFields.forEach(field => {
            if (operationData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(operationData[field]);
            }
        });

        // Si no hay campos para actualizar
        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No hay datos para actualizar' },
                { status: 400 }
            );
        }

        // Agregar el ID para la cláusula WHERE
        params.push(operationData.id);

        // Ejecutar la actualización
        await db.run(`
      UPDATE operations 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, params);

        // Si estamos cerrando la operación, actualizar el balance
        if (operationData.status === 'CLOSED' && currentOperation.status === 'OPEN') {
            // Calcular el resultado final
            const finalResult = currentOperation.position_size +
                (operationData.profit_loss || 0);

            // Actualizar el balance según la estrategia
            await updateBalanceForOperation(
                db,
                currentOperation.strategy_type,
                finalResult,
                'add'
            );
        }

        // Obtener la operación actualizada
        const updatedOperation = await db.get('SELECT * FROM operations WHERE id = ?', operationData.id);

        return NextResponse.json(updatedOperation);
    } catch (error) {
        console.error('Error al actualizar operación:', error);
        return NextResponse.json(
            { error: 'Error al actualizar operación' },
            { status: 500 }
        );
    }
}

// Función auxiliar para actualizar el balance según la estrategia
async function updateBalanceForOperation(db, strategy, amount, action) {
    try {
        // Obtener el portfolio actual
        const portfolio = await db.get('SELECT * FROM portfolio ORDER BY id DESC LIMIT 1');

        if (!portfolio) {
            console.error('No se encontró información del portfolio');
            return;
        }

        // Determinar qué campo actualizar
        let field;
        switch (strategy) {
            case 'ETH':
                field = 'eth_balance';
                break;
            case 'ALTCOIN':
                field = 'altcoin_balance';
                break;
            default:
                console.error('Estrategia no reconocida:', strategy);
                return;
        }

        // Calcular el nuevo balance
        const currentBalance = portfolio[field];
        const newBalance = action === 'add'
            ? currentBalance + amount
            : currentBalance - amount;

        // Actualizar el campo correspondiente
        await db.run(`
      UPDATE portfolio 
      SET ${field} = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [newBalance, portfolio.id]);

        // También actualizar el balance total
        const totalBalance = portfolio.total_balance + (action === 'add' ? amount : -amount);
        await db.run(`
      UPDATE portfolio 
      SET total_balance = ? 
      WHERE id = ?
    `, [totalBalance, portfolio.id]);

    } catch (error) {
        console.error('Error al actualizar el balance:', error);
        throw error;
    }
}