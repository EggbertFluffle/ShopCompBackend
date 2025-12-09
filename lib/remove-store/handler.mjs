// lib/remove-store/handler.mjs

import mysql from "mysql2";

<<<<<<< HEAD
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
=======
// ----- DB CONFIG (hard-coded with env overrides) -----
const DB_CONFIG = {
    host:
        process.env.RDS_HOST ||
        "shop-comp-db.c21wwuemqt70.us-east-1.rds.amazonaws.com",
    user: process.env.RDS_USER || "admin",
    password: process.env.RDS_PASSWORD || "SoftEng25",
    database: process.env.RDS_DATABASE || "shop-comp",
    port: 3306,
};

// Create MySQL pool
function createPool() {
    console.log("Connecting to DB host:", DB_CONFIG.host);
    return mysql.createPool(DB_CONFIG);
}

// Promise wrapper for mysql2 callback style
function query(pool, sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if (err) {
                console.error("DB Error:", err);
                reject(err);
            } else {
                resolve(result || []);
>>>>>>> b930c1b (Implement Remove Store Lambda (admin-only, WIP))
            }
        });
    });
}

export const handler = async (event) => {
    console.log("Incoming event (remove-store):", JSON.stringify(event));

<<<<<<< HEAD
    // When called from API Gateway the body is usually a JSON string = event || {};

    const username = event.username;
    const storeUuid = event.storeUuid || store.uuid;


    // ------------------------

    if (!username) {
        throw new Error("Missing 'username'");
    }
    if (!storeUuid) {
        throw new Error("Missing \'store Uuid\' or 'store.uuid'");
=======
    // Support both API Gateway style { body: "json" } and direct JSON
    let body;
    if (event && typeof event.body === "string") {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("Failed to parse body:", e);
            throw new Error("Invalid JSON body");
        }
    } else if (event && event.body) {
        body = event.body;
    } else {
        body = event || {};
    }

    const adminUsername =
        body["admin-username"] ?? body.adminUsername ?? body.username;
    const adminPassword =
        body["admin-password"] ?? body.adminPassword ?? body.password;
    const storeUuid = body["store-uuid"] ?? body.storeUuid;

    // --- Admin check (matches what you’re using in tests) ---
    if (adminUsername !== "admin" || adminPassword !== "SoftEng25") {
        throw new Error("Unauthorized administrator");
    }

    if (!storeUuid) {
        throw new Error("Missing 'store-uuid'");
>>>>>>> b930c1b (Implement Remove Store Lambda (admin-only, WIP))
    }

    const pool = createPool();

    try {
<<<<<<< HEAD
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
=======
        // Delete store by UUID
        const result = await query(
            pool,
            "DELETE FROM `Store` WHERE `uuid` = ?;",
            [storeUuid],
        );

        if (!result.affectedRows) {
            throw new Error("Store not found.");
        }

        return {
            state: "success",
            message: "Store removed successfully",
            admin: adminUsername,
            removedStoreUuid: storeUuid,
        };
    } catch (err) {
        console.error("Error while removing store:", err);
        throw err;
>>>>>>> b930c1b (Implement Remove Store Lambda (admin-only, WIP))
    }
};
