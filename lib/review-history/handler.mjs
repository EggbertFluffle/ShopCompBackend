import mysql from "mysql2";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
    var pool = mysql.createPool({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
    });

    const shopperUsername = event.username;
    const shopperUuid = event.uuid;

    if (!shopperUsername || !shopperUuid) {
      pool.end();
      throw new Error(
        "Error retrieving review history. Invalid shopper credentials."
      );
    }


}