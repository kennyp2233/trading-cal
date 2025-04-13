// app/api/drawdown/route.js
import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db/schema';

// GET /api/drawdown - Obtener eventos de drawdown
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get('active'); // 'true' para obtener solo eventos activos
        const limit = searchParams.get('limit') || 10;

        const db = await getDb();

        let query = 'SELECT * FROM drawdown_events';
        const params = [];

        // Filtrar por eventos activos si se solicita
        if (active === 'true') {
            query += ' WHERE end_date IS NULL';
        }

        // Ordenar y limitar resultados
        query += ' ORDER BY start_date DESC LIMIT ?';
        params.push(limit);

        const drawdownEvents = await db.all(query, params);

        return NextResponse.json(drawdownEvents);
    } catch (error) {
        console.error('Error al obtener eventos de drawdown:', error);
        return NextResponse.json(
            { error: 'Error al obtener eventos de drawdown' },
            { status: 500 }
        );
    }
}

// POST /api/drawdown - Registrar un nuevo evento de drawdown
export async function POST(request) {
    try {
        const drawdownData = await request.json();

        // Validar datos mínimos requeridos
        if (!drawdownData.level || !drawdownData.initial_balance || !drawdownData.drawdown_percentage) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos para el registro de drawdown' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Comprobar si ya hay un evento activo del mismo nivel o superior
        const activeEvent = await db.get(`
            SELECT * FROM drawdown_events 
            WHERE end_date IS NULL AND level >= ? 
            ORDER BY level DESC LIMIT 1
        `, [drawdownData.level]);

        if (activeEvent) {
            return NextResponse.json({
                error: 'Ya existe un evento de drawdown activo de nivel igual o superior',
                activeEvent
            }, { status: 400 });
        }

        // Preparar datos para inserción
        const {
            level,
            initial_balance,
            lowest_balance = null,
            drawdown_percentage,
            actions_taken = null,
            notes = null
        } = drawdownData;

        // Insertar en la base de datos
        const result = await db.run(`
            INSERT INTO drawdown_events (
                level, initial_balance, lowest_balance, drawdown_percentage,
                actions_taken, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            level, initial_balance, lowest_balance, drawdown_percentage,
            actions_taken, notes
        ]);

        // Obtener el evento recién creado
        const newEvent = await db.get('SELECT * FROM drawdown_events WHERE id = ?', result.lastID);

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error('Error al registrar evento de drawdown:', error);
        return NextResponse.json(
            { error: 'Error al registrar evento de drawdown' },
            { status: 500 }
        );
    }
}

// PATCH /api/drawdown/:id - Actualizar un evento de drawdown (normalmente para cerrarlo)
export async function PATCH(request, { params }) {
    try {
        const eventData = await request.json();
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Se requiere el ID del evento' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Obtener el evento actual
        const currentEvent = await db.get('SELECT * FROM drawdown_events WHERE id = ?', id);

        if (!currentEvent) {
            return NextResponse.json(
                { error: 'Evento de drawdown no encontrado' },
                { status: 404 }
            );
        }

        // Preparar los valores actualizados
        const updates = [];
        const params = [];

        // Campos que se pueden actualizar
        const updatableFields = [
            'end_date', 'lowest_balance', 'actions_taken',
            'recovery_successful', 'notes'
        ];

        updatableFields.forEach(field => {
            if (eventData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(eventData[field]);
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
            UPDATE drawdown_events 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `, params);

        // Obtener el evento actualizado
        const updatedEvent = await db.get('SELECT * FROM drawdown_events WHERE id = ?', id);

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error('Error al actualizar evento de drawdown:', error);
        return NextResponse.json(
            { error: 'Error al actualizar evento de drawdown' },
            { status: 500 }
        );
    }
}