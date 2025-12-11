import mysql from "mysql2";

export const handler = async (event) => {
    const adminUuid = event["admin-uuid"];
    const chainUuid = event["chain-uuid"];

    if (!adminUuid) {
        throw new Error("No admin UUID given");
    }

    if (!chainUuid) {
        throw new Error("Missing 'chain-uuid'");
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
                        throw new Error("Admin with uuid does not exist");
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

    const removeChain = () => {
        return new Promise((resolve, reject) => {
            pool.query(
                "DELETE FROM \`Store Chain\` WHERE uuid = ?;",
                [chainUuid],
                (err, result) => {
                    if (err) {
                        throw new Error("Chain does not exist" + err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    await removeChain();

    pool.end();
    
    return {};
};
