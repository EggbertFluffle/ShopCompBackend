import mysql from "mysql2";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
	var pool = mysql.createPool({
		host: process.env.RDS_HOST,
		user: process.env.RDS_USER,
		password: process.env.RDS_PASSWORD,
		database: process.env.RDS_DATABASE,
	});

	const storeChainName = event["store-chain-name"];
	const storeChainUrl = event["store-chain-url"];

	const storeChainUUID = uuidv4();

	if(!storeChainName || !storeChainUrl) {
		throw new Error("store-chain-name or store-chain-url not given!");
	}


	const insertStoreChain = () => {
		return new Promise((resolve, reject) => {
			const insertQuery =
				"INSERT INTO \`Store Chain\` (uuid, name, url) VALUES (?, ?, ?)";
			pool.query(
				insertQuery,
				[storeChainUUID, storeChainName, storeChainUrl],
				(error, insertResult) => {
					if (error) {
						reject(new Error("Database error: " + error.sqlMessage));
					} else {
						resolve(insertResult);
					}
				}
			);
		});
	};

    await insertStoreChain();

	return {};
}
