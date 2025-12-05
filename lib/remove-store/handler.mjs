// lib/remove-store/handler.mjs

import mysql from "mysql2";

// Create MySQL pool (same as add-store)
function createPool() {
    return mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
    });
}

// Small helper to run queries with promises
function query(pool, sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

export const handler = async (event) => {
    console.log("Incoming event (remove-store):", JSON.stringify(event));

    // When called from API Gateway the body is usually a JSON string = event || {};

    const username = event.username;
    const storeUuid = event.storeUuid || store.uuid;


    // ------------------------

    if (!username) {
        throw new Error("Missing 'username'");
    }
    if (!storeUuid) {
        throw new Error("Missing \'store Uuid\' or 'store.uuid'");
    }

    const pool = createPool();

    try {
        // 1) Look up the store chain by name
        //    MATCHES your add-store code: table is `StoreChain`, column is id


        // 2) Delete the store for that chain
        //    MATCHES schema used in add-store: store_chain_id (underscore)
        const deleteResult = await query(
            pool,
            "DELETE FROM `Store` WHERE uuid = ?;",
            [storeUuid]
        );




        return {

        };
    } catch (err) {
        console.error("Error in remove-store:", err);
        throw new Error(err.message || "Unknown error");
    } finally {
        // Let Lambda reuse connections; don't end the pool.
    }
};
