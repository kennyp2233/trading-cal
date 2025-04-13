// lib/db/schema.js
import { Database } from 'sqlite3';
import { open } from 'sqlite';

// Función para inicializar la base de datos
export async function initializeDatabase() {
    const db = await open({
        filename: './trading-strategy.db',
        driver: Database
    });

    // Crear tablas si no existen
    await db.exec(`
    -- Tabla de configuración del sistema
    CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY,
      paxg_min_percentage REAL NOT NULL DEFAULT 40,
      eth_max_percentage REAL NOT NULL DEFAULT 40,
      altcoin_max_percentage REAL NOT NULL DEFAULT 20,
      max_drawdown_allowed REAL NOT NULL DEFAULT 25,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de balance total y distribución
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY,
      total_balance REAL NOT NULL,
      paxg_balance REAL NOT NULL,
      eth_balance REAL NOT NULL,
      altcoin_balance REAL NOT NULL,
      premercado_balance REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de operaciones
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY,
      strategy_type TEXT NOT NULL CHECK (strategy_type IN ('ETH', 'ALTCOIN')),
      asset_name TEXT NOT NULL,
      operation_type TEXT NOT NULL CHECK (operation_type IN ('BUY', 'SELL')),
      entry_price REAL NOT NULL,
      exit_price REAL,
      amount REAL NOT NULL,
      position_size REAL NOT NULL,
      stop_loss REAL,
      take_profit_1 REAL,
      take_profit_2 REAL,
      take_profit_3 REAL,
      status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
      entry_reason TEXT,
      exit_reason TEXT,
      profit_loss REAL,
      profit_loss_percentage REAL,
      entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      exit_date TIMESTAMP,
      notes TEXT
    );

    -- Tabla de rotaciones entre estrategias
    CREATE TABLE IF NOT EXISTS rotations (
      id INTEGER PRIMARY KEY,
      rotation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      from_strategy TEXT NOT NULL CHECK (from_strategy IN ('PAXG', 'ETH', 'ALTCOIN')),
      to_strategy TEXT NOT NULL CHECK (to_strategy IN ('PAXG', 'ETH', 'ALTCOIN')),
      amount REAL NOT NULL,
      percentage_of_origin REAL NOT NULL,
      trigger_condition TEXT NOT NULL,
      notes TEXT
    );

    -- Tabla de rendimiento por estrategia
    CREATE TABLE IF NOT EXISTS strategy_performance (
      id INTEGER PRIMARY KEY,
      strategy_type TEXT NOT NULL CHECK (strategy_type IN ('ETH', 'ALTCOIN', 'OVERALL')),
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      win_count INTEGER NOT NULL DEFAULT 0,
      loss_count INTEGER NOT NULL DEFAULT 0,
      profit_loss REAL NOT NULL DEFAULT 0,
      profit_loss_percentage REAL,
      max_drawdown REAL,
      notes TEXT
    );

    -- Tabla de niveles de drawdown y protección
    CREATE TABLE IF NOT EXISTS drawdown_events (
      id INTEGER PRIMARY KEY,
      level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP,
      initial_balance REAL NOT NULL,
      lowest_balance REAL,
      drawdown_percentage REAL NOT NULL,
      actions_taken TEXT,
      recovery_successful BOOLEAN,
      notes TEXT
    );
  `);

    // Insertar configuración predeterminada si no existe
    const config = await db.get('SELECT * FROM system_config LIMIT 1');
    if (!config) {
        await db.run(`
      INSERT INTO system_config (paxg_min_percentage, eth_max_percentage, altcoin_max_percentage, max_drawdown_allowed)
      VALUES (40, 40, 20, 25)
    `);
    }

    return db;
}

// Exportar función para obtener la conexión a la base de datos
let dbConnection = null;

export async function getDb() {
    if (!dbConnection) {
        dbConnection = await initializeDatabase();
    }
    return dbConnection;
}