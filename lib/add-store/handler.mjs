import mysql from "mysql2";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
    const storeChainUUID = event["store-chain-uuid"];
    const address = event.address;

    if (!storeChainUUID || !address) {
        throw new Error("Missing address or store-chain-uuid");
    }

    const pool = mysql.createPool({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER, 
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
    });

    const chainExists = async () => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT uuid FROM \`Store Chain\` WHERE uuid = ?;", 
                [storeChainUUID], 
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    const chains = await chainExists();
    
    if(chains.length == 0) {
        throw new Error("No chains exist with the spesified UUID");
    }

    const storeUUID = uuidv4();
    const insertStore = async () => {
        return new Promise((resolve, reject) => {
            pool.query("INSERT INTO \`Store\` (uuid, address, \`store-chain-uuid\`) VALUES (?, ?, ?);", 
                [storeUUID, address, storeChainUUID], 
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    };

    await insertStore();

    return {};
};
