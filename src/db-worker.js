// Fixed db-worker.js with proper ESM handling
import { expose } from "comlink";
import * as duckdb from "@duckdb/duckdb-wasm";

let db, conn;

async function init() {
    try {
        console.log('DB Worker: Initializing DuckDB...');

        // Use LOCAL bundles from node_modules, not CDN!
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

        const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
        console.log('DB Worker: Bundle selected');

        // Create worker with local bundle
        const worker = new Worker(bundle.mainWorker, { type: 'module' });
        console.log('DB Worker: Sub-worker created.');

        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule);
        conn = await db.connect();
        console.log('DB Worker: Connection established.');

        await conn.query(`CREATE TABLE sales (date DATE, item VARCHAR, amount INT);`);
        console.log('DB Worker: Table "sales" created.');
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
        console.log(`DB Worker: Seeding ${rows} random rows (start: ${startISO}, end: ${endISO}, items: ${items.length})...`);
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
        let sql = `SELECT COUNT(*) as count FROM sales WHERE date BETWEEN '${startISO}' AND '${endISO}'`;
        if (fruit) sql += ` AND item='${fruit}'`;
        console.log(`DB Worker: Executing count query: ${sql}`);
        const res = await conn.query(sql);
        const rows = res.toArray();
        const count = Number(rows[0].count);
        console.log(`DB Worker: Count result: ${count}`);
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
        console.log(`DB Worker: Executing paginated query: ${sql}`);
        const res = await conn.query(sql);
        const rows = res.toArray();
        console.log(`DB Worker: Paginated query returned ${rows.length} rows.`);
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
        console.log(`DB Worker: Executing aggregate query: ${sql}`);
        const res = await conn.query(sql);
        const rows = res.toArray();

        const aggregates = rows.map(r => ({
            item: String(r.item),
            amount: Number(r.total)
        }));
        console.log(`DB Worker: Aggregate query returned ${aggregates.length} items:`, aggregates);
        return aggregates;
    } catch (error) {
        console.error('DB Worker: Aggregate query failed:', error);
        throw error;
    }
}

expose({ init, seedRandom, countRows, queryPaginated, aggregateForChart });