import mysql from "mysql2";

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
    const adminUuid = event["admin-uuid"];
    const storeUuid = event["store-uuid"]

    if (!adminUuid) {
        throw new Error("No admin UUID given");
    }

    if (!storeUuid) {
        throw new Error("Missing 'store-uuid'");
    }

    const pool = mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
        port: 3306,
    });

    const admins = await query(
        pool,
        "SELECT * FROM `Admin` WHERE `uuid` = ?;",
        [adminUuid],
    );

    if(admins.length === 0) {
        throw new Error("Admin not found.");
    }

    const result = await query(
        pool,
        "DELETE FROM `Store` WHERE `uuid` = ?;",
        [storeUuid],
    );

    if (!result.affectedRows) {
        throw new Error("Store not found.");
    }

    return {};
};
