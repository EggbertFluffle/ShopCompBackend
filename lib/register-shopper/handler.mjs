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
	const uuid = uuidv4();

	// Check if the shopper's username already exists
	const checkExists = () => {
		return new Promise((resolve, reject) => {

			const checkQuery = "SELECT * FROM Shopper WHERE username = ?"

			pool.query(checkQuery, [username], (error, rows) => {
				if (error) {
					reject(new Error("Database error: " + error.sqlMessage))
				} else {
					resolve(rows && rows.length > 0)
				}
			})
		})
	}

	// Insert new shopper
	const insertShopper = () => {
		return new Promise((resolve, reject) => {
			const insertQuery = "INSERT INTO Shopper (uuid, username, password, is_admin) VALUES (?, ?, ?, ?)"
			pool.query(insertQuery, [uuid, username, password, 0], (error, insertResult) => {
				if (error) {
					reject(new Error("Database error: " + error.sqlMessage));
				} else {
					resolve(insertResult);
				}
			});
		});
	}

	// Check if shopper with username already exists
	const exists = await checkExists()
	if (exists) {
		pool.end();
		throw new Error("Error creating account. User with the username " + username + " already exists!");
	}

	await insertShopper();

	pool.end();
	return { "shopper-uuid": uuid };
} 
