import mysql from "mysql2";
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event) => {
	// specify credentials 
	var pool = mysql.createPool({
		host: 	process.env.RDS_HOST,
		user: 	process.env.RDS_USER,
		password: process.env.RDS_PASSWORD,
		database: process.env.RDS_DATABASE
	});

	// Validate input
	if (!event.username || !event.password) {
		pool.end();
		throw new Error("Error creating account. Please follow the username/password policy");
	}

	const username = event.username;
	const password = event.password;

	// Check if the shopper's username already exists
	const getShopper = () => {
		return new Promise((resolve, reject) => {
			const query = "SELECT uuid FROM Shopper WHERE username = ? AND password = ?";

			pool.query(query, [username, password], (error, rows) => {
				if (error) {
					reject(new Error("Database error: " + error.sqlMessage));
				} else {
					resolve(rows);
				}
			})
		})
	}

	// Check if shopper with username already exists
	const shopper = await getShopper()
	if (shopper.length === 0) {
		pool.end();
		throw new Error("Error logging in. Wrong username or password.");
	}

	pool.end();
	return { "shopper-uuid": shopper[0].uuid };
} 
