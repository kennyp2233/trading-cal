// app/api/operations/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db/schema';

// GET /api/operations/:id - Obtener una operación específica
export async function GET(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Se requiere el ID de la operación' },
                { status: 400 }
            );
        }

        const db = await getDb();

        const operation = await db.get('SELECT * FROM operations WHERE id = ?', id);

        if (!operation) {
            return NextResponse.json(
                { error: 'Operación no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(operation);
    } catch (error) {
        console.error('Error al obtener operación:', error);
        return NextResponse.json(
            { error: 'Error al obtener la operación' },
            { status: 500 }
        );
    }
}

// PATCH /api/operations/:id - Actualizar una operación existente (para cerrar operaciones)
export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const operationData = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Se requiere el ID de la operación' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Obtener la operación actual
        const currentOperation = await db.get('SELECT * FROM operations WHERE id = ?', id);

        if (!currentOperation) {
            return NextResponse.json(
                { error: 'Operación no encontrada' },
                { status: 404 }
            );
        }

        // Solo permitir actualizar operaciones abiertas si estamos cerrándola
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
        params.push(id);

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
        const updatedOperation = await db.get('SELECT * FROM operations WHERE id = ?', id);

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