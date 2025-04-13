// app/api/portfolio/route.js
import { NextResponse } from 'next/server';
import { getDb } from  '../../../lib/db/schema';

// GET /api/portfolio - Obtener información del portfolio
export async function GET(request) {
    try {
        const db = await getDb();

        // Obtener el portfolio más reciente
        const portfolio = await db.get('SELECT * FROM portfolio ORDER BY id DESC LIMIT 1');

        if (!portfolio) {
            return NextResponse.json(
                { error: 'No se encontró información del portfolio' },
                { status: 404 }
            );
        }

        // Calcular la distribución porcentual
        const distribution = [
            {
                name: 'PAXG',
                value: portfolio.paxg_balance,
                percentage: Math.round((portfolio.paxg_balance / portfolio.total_balance) * 100)
            },
            {
                name: 'ETH',
                value: portfolio.eth_balance,
                percentage: Math.round((portfolio.eth_balance / portfolio.total_balance) * 100)
            },
            {
                name: 'Altcoins',
                value: portfolio.altcoin_balance,
                percentage: Math.round((portfolio.altcoin_balance / portfolio.total_balance) * 100)
            }
        ];

        // Si hay balance de premercado, añadirlo a la distribución
        if (portfolio.premercado_balance > 0) {
            distribution.push({
                name: 'Premercado',
                value: portfolio.premercado_balance,
                percentage: Math.round((portfolio.premercado_balance / portfolio.total_balance) * 100)
            });
        }

        // Devolver el portfolio con la distribución
        return NextResponse.json({
            ...portfolio,
            distribution
        });
    } catch (error) {
        console.error('Error al obtener portfolio:', error);
        return NextResponse.json(
            { error: 'Error al obtener información del portfolio' },
            { status: 500 }
        );
    }
}

// POST /api/portfolio/init - Inicializar el portfolio (solo si no existe)
export async function POST(request) {
    try {
        const db = await getDb();

        // Verificar si ya existe un portfolio
        const existingPortfolio = await db.get('SELECT * FROM portfolio LIMIT 1');

        if (existingPortfolio) {
            return NextResponse.json(
                { error: 'Ya existe un portfolio inicializado' },
                { status: 400 }
            );
        }

        const portfolioData = await request.json();

        // Valores por defecto si no se proporcionan
        const {
            total_balance = 93,
            paxg_balance = 42,
            eth_balance = 33,
            altcoin_balance = 18,
            premercado_balance = 0
        } = portfolioData;

        // Insertar portfolio inicial
        await db.run(`
            INSERT INTO portfolio (
                total_balance, paxg_balance, eth_balance, altcoin_balance, premercado_balance
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            total_balance, paxg_balance, eth_balance, altcoin_balance, premercado_balance
        ]);

        // Obtener el portfolio recién creado
        const newPortfolio = await db.get('SELECT * FROM portfolio ORDER BY id DESC LIMIT 1');

        return NextResponse.json(newPortfolio, { status: 201 });
    } catch (error) {
        console.error('Error al inicializar portfolio:', error);
        return NextResponse.json(
            { error: 'Error al inicializar el portfolio' },
            { status: 500 }
        );
    }
}

// PATCH /api/portfolio - Actualizar el portfolio manualmente
export async function PATCH(request) {
    try {
        const portfolioData = await request.json();

        // Validar que al menos un campo se esté actualizando
        const updatableFields = ['total_balance', 'paxg_balance', 'eth_balance', 'altcoin_balance', 'premercado_balance'];
        const hasUpdates = updatableFields.some(field => portfolioData[field] !== undefined);

        if (!hasUpdates) {
            return NextResponse.json(
                { error: 'No hay datos para actualizar' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Obtener el portfolio actual
        const currentPortfolio = await db.get('SELECT * FROM portfolio ORDER BY id DESC LIMIT 1');

        if (!currentPortfolio) {
            return NextResponse.json(
                { error: 'No se encontró un portfolio para actualizar' },
                { status: 404 }
            );
        }

        // Preparar los valores actualizados
        const updates = [];
        const params = [];

        updatableFields.forEach(field => {
            if (portfolioData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(portfolioData[field]);
            }
        });

        // Añadir la fecha de actualización y el ID para la cláusula WHERE
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(currentPortfolio.id);

        // Ejecutar la actualización
        await db.run(`
            UPDATE portfolio 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `, params);

        // Obtener el portfolio actualizado
        const updatedPortfolio = await db.get('SELECT * FROM portfolio WHERE id = ?', currentPortfolio.id);

        return NextResponse.json(updatedPortfolio);
    } catch (error) {
        console.error('Error al actualizar portfolio:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el portfolio' },
            { status: 500 }
        );
    }
}