// app/api/system-config/route.js
import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db/schema';

// GET /api/system-config - Obtener la configuración del sistema
export async function GET() {
    try {
        const db = await getDb();

        // Obtener la configuración más reciente
        const config = await db.get('SELECT * FROM system_config ORDER BY id DESC LIMIT 1');

        if (!config) {
            return NextResponse.json(
                { error: 'No se encontró configuración del sistema' },
                { status: 404 }
            );
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error al obtener configuración del sistema:', error);
        return NextResponse.json(
            { error: 'Error al obtener configuración del sistema' },
            { status: 500 }
        );
    }
}

// PATCH /api/system-config - Actualizar la configuración del sistema
export async function PATCH(request) {
    try {
        const configData = await request.json();

        // Validar que al menos un campo se esté actualizando
        const updatableFields = ['paxg_min_percentage', 'eth_max_percentage', 'altcoin_max_percentage', 'max_drawdown_allowed'];
        const hasUpdates = updatableFields.some(field => configData[field] !== undefined);

        if (!hasUpdates) {
            return NextResponse.json(
                { error: 'No hay datos para actualizar' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Obtener la configuración actual
        const currentConfig = await db.get('SELECT * FROM system_config ORDER BY id DESC LIMIT 1');

        if (!currentConfig) {
            return NextResponse.json(
                { error: 'No se encontró configuración del sistema para actualizar' },
                { status: 404 }
            );
        }

        // Preparar los valores actualizados
        const updates = [];
        const params = [];

        updatableFields.forEach(field => {
            if (configData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(configData[field]);
            }
        });

        // Añadir la fecha de actualización y el ID para la cláusula WHERE
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(currentConfig.id);

        // Ejecutar la actualización
        await db.run(`
            UPDATE system_config 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `, params);

        // Obtener la configuración actualizada
        const updatedConfig = await db.get('SELECT * FROM system_config WHERE id = ?', currentConfig.id);

        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error('Error al actualizar configuración del sistema:', error);
        return NextResponse.json(
            { error: 'Error al actualizar configuración del sistema' },
            { status: 500 }
        );
    }
}