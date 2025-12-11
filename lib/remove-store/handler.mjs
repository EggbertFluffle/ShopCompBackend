import mysql from "mysql2";

export const handler = async (event) => {
    const adminUuid = event["admin-uuid"];
    const storeUuid = event["store-uuid"];

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

    const getAdmins = () => {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Shopper WHERE uuid = ?;",
                [adminUuid],
                (err, result) => {
                    if (err) {
                        console.error("DB Error:", err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    const admins = await getAdmins();
    if(admins.length == 0) {
        throw new Error("Admin not found.");
    }

    const removeStore = () => {
        return new Promise((resolve, reject) => {
            pool.query(
                "DELETE FROM Store WHERE uuid = ?;",
                [storeUuid],
                (err, result) => {
                    if (err) {
                        throw new Error("Store does not exist" + err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    await removeStore();

    pool.end();
    
    return {};
};
