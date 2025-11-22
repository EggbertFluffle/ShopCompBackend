import mysql from "mysql2";

/**
 * Lambda handler for /login-administrator
 *
 * Expects event from API Gateway mapping like:
 * {
 *   "admin-username": "admin",
 *   "password": "goat123"
 * }
 */
export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event));

    // ---- DB connection (same style as register-shopper) ----
    const pool = mysql.createPool({
        // IMPORTANT: this should be your RDS endpoint, NOT localhost
        host: process.env.RDS_HOST,          // e.g. shop-comp-db.c21wwuemqt70.us-east-1.rds.amazonaws.com
        user: process.env.RDS_USER,          // "admin"
        password: process.env.RDS_PASSWORD,  // "SoftEng25"
        database: process.env.RDS_DATABASE,  // "shop-comp"
    });

    // Log what host Lambda *thinks* it’s using
    console.log("DB host from env:", process.env.RDS_HOST);

    const username = event["admin-username"];
    const password = event.password;

    if (!username || !password) {
        pool.end();
        return {
            statusCode: 400,
            body: JSON.stringify({
                state: "error",
                message: "Missing admin-username or password",
            }),
        };
    }

    try {
        const conn = pool.promise();

        const [rows] = await conn.execute(
            "SELECT uuid FROM Shopper WHERE username = ? AND password = ? AND is_admin = 1",
            [username, password]
        );

        pool.end();

        if (rows.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    state: "error",
                    message: "Invalid credentials or not an admin",
                }),
            };
        }

        const adminUuid = rows[0].uuid;

        return {
            statusCode: 200,
            body: JSON.stringify({
                state: "success",
                "admin-uuid": adminUuid,
            }),
        };
    } catch (err) {
        console.error("Database error:", err);
        pool.end();
        return {
            statusCode: 400,
            body: JSON.stringify({
                state: "error",
                message: `Database error: ${err.code || err.message}`,
            }),
        };
    }
};
