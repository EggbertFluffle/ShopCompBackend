// lib/remove-store/handler.mjs

import mysql from "mysql2";

// ----- DB CONFIG (env-driven) -----
function createPool() {
    const config = {
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
        port: 3306,
    };

    console.log("Connecting to DB host:", config.host);
    return mysql.createPool(config);
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
            }
        });
    });
}

export const handler = async (event) => {
    console.log("Incoming event (remove-store):", JSON.stringify(event));

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

    // --- Admin check (for this assignment) ---
    if (adminUsername !== "admin" || adminPassword !== "SoftEng25") {
        throw new Error("Unauthorized administrator");
    }

    if (!storeUuid) {
        throw new Error("Missing 'store-uuid'");
    }

    const pool = createPool();

    try {
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
    }
};
