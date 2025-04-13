// app/api/rotations/route.js
import { NextResponse } from 'next/server';
import { getDb } from  '../../../lib/db/schema';

// GET /api/rotations - Obtener historial de rotaciones
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || 10;

        const db = await getDb();

        const rotations = await db.all(`
            SELECT * FROM rotations 
            ORDER BY rotation_date DESC 
            LIMIT ?
        `, [limit]);

        return NextResponse.json(rotations);
    } catch (error) {
        console.error('Error al obtener rotaciones:', error);
        return NextResponse.json(
            { error: 'Error al obtener historial de rotaciones' },
            { status: 500 }
        );
    }
}

// POST /api/rotations - Crear una nueva rotación
export async function POST(request) {
    try {
        const rotationData = await request.json();

        // Validar datos mínimos requeridos
        if (!rotationData.from_strategy || !rotationData.to_strategy ||
            !rotationData.amount || !rotationData.percentage_of_origin) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos para la rotación' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Preparar datos para inserción
        const {
            from_strategy,
            to_strategy,
            amount,
            percentage_of_origin,
            trigger_condition,
            notes = null
        } = rotationData;

        // Insertar en la base de datos
        const result = await db.run(`
            INSERT INTO rotations (
                from_strategy, to_strategy, amount, percentage_of_origin,
                trigger_condition, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            from_strategy, to_strategy, amount, percentage_of_origin,
            trigger_condition, notes
        ]);

        // Obtener la rotación recién creada
        const newRotation = await db.get('SELECT * FROM rotations WHERE id = ?', result.lastID);

        // Actualizar los balances según la rotación realizada
        await updateBalancesAfterRotation(db, from_strategy, to_strategy, amount);

        return NextResponse.json(newRotation, { status: 201 });
    } catch (error) {
        console.error('Error al crear rotación:', error);
        return NextResponse.json(
            { error: 'Error al registrar la rotación' },
            { status: 500 }
        );
    }
}

// Función auxiliar para actualizar balances después de una rotación
async function updateBalancesAfterRotation(db, fromStrategy, toStrategy, amount) {
    try {
        // Obtener el portfolio actual
        const portfolio = await db.get('SELECT * FROM portfolio ORDER BY id DESC LIMIT 1');

        if (!portfolio) {
            console.error('No se encontró información del portfolio');
            return;
        }

        // Convertir estrategias a nombres de campo
        const fromField = `${fromStrategy.toLowerCase()}_balance`;

        // Caso especial para ETH/PAXG (dividir 50/50)
        if (toStrategy === 'ETH/PAXG') {
            const halfAmount = amount / 2;

            // Actualizar balances
            await db.run(`
                UPDATE portfolio 
                SET 
                    ${fromField} = ${fromField} - ?,
                    eth_balance = eth_balance + ?,
                    paxg_balance = paxg_balance + ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [amount, halfAmount, halfAmount, portfolio.id]);
        } else {
            const toField = `${toStrategy.toLowerCase()}_balance`;

            // Actualizar balances
            await db.run(`
                UPDATE portfolio 
                SET 
                    ${fromField} = ${fromField} - ?,
                    ${toField} = ${toField} + ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [amount, amount, portfolio.id]);
        }
    } catch (error) {
        console.error('Error al actualizar balances después de rotación:', error);
        throw error;
    }
}