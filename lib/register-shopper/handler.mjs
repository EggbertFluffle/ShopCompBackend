import mysql from "mysql2";

export const handler = async (event) => {
    // Create connection pool
    const pool = mysql.createPool({
        host:     process.env.RDS_HOST,
        user:     process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE
    });

    // ---- 1. Validate input ----
    // JSON spec uses "admin-username"
    const adminUsername = event["admin-username"];
    const password = event.password;

    if (!adminUsername || !password) {
        pool.end();
        throw new Error("Error logging in. Please follow the username/password policy");
    }

    // ---- 2. Look up admin in DB ----
    const getAdmin = () => {
        return new Promise((resolve, reject) => {
            const sql =
                "SELECT uuid, username, password, is_admin FROM Shopper WHERE username = ? AND is_admin = 1";

            pool.query(sql, [adminUsername], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.sqlMessage));
                } else {
                    // rows[0] if exists, otherwise null
                    resolve(rows && rows.length > 0 ? rows[0] : null);
                }
            });
        });
    };

    try {
        const adminRow = await getAdmin();

        // No such admin OR wrong password
        if (!adminRow || adminRow.password !== password) {
            throw new Error("Error logging in. Wrong username or password ");
        }

        // ---- 3. Success: return admin-uuid ----
        return {
            "admin-uuid": adminRow.uuid
        };

    } finally {
        // Always close pool
        pool.end();
    }
};
