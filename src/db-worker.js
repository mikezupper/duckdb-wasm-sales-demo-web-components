// db-worker.js
import { expose } from "comlink";
import * as duckdb from "@duckdb/duckdb-wasm";

let db, conn;

// Choose EH when available (better threading and OPFS support), else MVP.
const DUCKDB_BUNDLES = {
    mvp: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).href,
    },
    eh: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).href,
    },
};

async function init() {
    try {
        console.log('DB Worker: Initializing DuckDB (persistent IndexedDB)...');

        const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
        const worker = new Worker(bundle.mainWorker, { type: 'module' });

        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(logger, worker);

        // Instantiate the engine
        await db.instantiate(bundle.mainModule);

        // Open or create a persistent database file in IndexedDB
        // await db.open({
        //     path: 'sales-db.duckdb',
        //     storage: 'indexeddb',
        //     query: {
        //         castBigIntToDouble: true,
        //         castTimestampToDate: true
        //     },
        //     access_mode: 'READ_WRITE'
        // });

        // Connect to the persistent DB
        conn = await db.connect();
        console.log('DB Worker: Connected to persistent DB file in IndexedDB.');

        // Create table if it doesn't exist (idempotent)
        await conn.query(`CREATE TABLE IF NOT EXISTS sales (date DATE, item VARCHAR, amount INT);`);
        console.log('DB Worker: Ensured table "sales" exists.');
    } catch (error) {
        console.error('DB Worker: Init failed:', error);
        throw error;
    }
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDateISO(startISO, endISO) {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    const t = start + Math.random() * (end - start);
    return new Date(t).toISOString().split("T")[0];
}

async function seedRandom(items, startISO, endISO, rows) {
    try {
        console.log(`DB Worker: Seeding ${rows} random rows (persistent DB)...`);
        const values = [];
        for (let i = 0; i < rows; i++) {
            const item = items[randInt(0, items.length - 1)];
            const amount = randInt(5, 45);
            const d = randDateISO(startISO, endISO);
            values.push(`('${d}','${item}',${amount})`);
        }
        if (values.length) {
            await conn.query(`INSERT INTO sales VALUES ${values.join(",")};`);
            console.log(`DB Worker: Inserted ${values.length} rows into "sales".`);
            await conn.query('CHECKPOINT;');
        } else {
            console.warn('DB Worker: No values to insert.');
        }
    } catch (error) {
        console.error('DB Worker: Seed failed:', error);
        throw error;
    }
}

async function countRows(startISO, endISO, fruit) {
    try {
        let sql = `SELECT COUNT(*) AS count FROM sales WHERE date BETWEEN '${startISO}' AND '${endISO}'`;
        if (fruit) sql += ` AND item='${fruit}'`;
        const res = await conn.query(sql);
        const rows = res.toArray();
        const count = Number(rows[0].count);
        return count;
    } catch (error) {
        console.error('DB Worker: Count query failed:', error);
        throw error;
    }
}

async function queryPaginated(startISO, endISO, fruit, limit, offset) {
    try {
        let sql = `SELECT date, item, amount FROM sales WHERE date BETWEEN '${startISO}' AND '${endISO}'`;
        if (fruit) sql += ` AND item='${fruit}'`;
        sql += ` ORDER BY date LIMIT ${limit} OFFSET ${offset}`;
        const res = await conn.query(sql);
        const rows = res.toArray();
        return rows.map(r => [r.date, r.item, r.amount]);
    } catch (error) {
        console.error('DB Worker: Paginated query failed:', error);
        throw error;
    }
}

async function aggregateForChart(startISO, endISO, fruit) {
    try {
        let sql = `SELECT item, SUM(amount) AS total FROM sales WHERE date BETWEEN '${startISO}' AND '${endISO}'`;
        if (fruit) sql += ` AND item='${fruit}'`;
        sql += ` GROUP BY item ORDER BY item`;
        const res = await conn.query(sql);
        const rows = res.toArray();
        return rows.map(r => ({ item: String(r.item), amount: Number(r.total) }));
    } catch (error) {
        console.error('DB Worker: Aggregate query failed:', error);
        throw error;
    }
}

async function vacuum() {
    await conn.query('VACUUM;');
}

async function checkpoint() {
    await conn.query('CHECKPOINT;');
}

expose({ init, seedRandom, countRows, queryPaginated, aggregateForChart, vacuum, checkpoint });