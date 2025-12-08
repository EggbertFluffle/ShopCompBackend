import mysql from "mysql2";

export const handler = async (event) => {
  const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  const checkAdmin = (adminUUID) => {
    return new Promise((resolve, reject) => {
      const adminCheckQuery = `
        SELECT is_admin
        FROM Shopper
        WHERE uuid = ?
      `;

      pool.query(adminCheckQuery, [adminUUID], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.sqlMessage));
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  const getSales = () => {
    return new Promise((resolve, reject) => {
      const salesQuery = `
        SELECT 
          \`Store Chain\`.uuid AS chain_uuid,
          \`Store Chain\`.name AS chain_name,
          COALESCE(SUM(Item.price * Item.quantity), 0) AS total_sales
        FROM \`Store Chain\`
        LEFT JOIN Store
          ON \`Store Chain\`.uuid = Store.\`store-chain-uuid\`
        LEFT JOIN Receipt
          ON Store.uuid = Receipt.\`store-uuid\`
        LEFT JOIN Item
          ON Receipt.uuid = Item.\`receipt-uuid\`
        GROUP BY \`Store Chain\`.uuid, \`Store Chain\`.name
        ORDER BY \`Store Chain\`.name ASC
      `;

      pool.query(salesQuery, (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.sqlMessage));
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  const adminUUID = event["admin-uuid"];

  const adminRows = await checkAdmin(adminUUID);

  if (adminRows.length === 0 || adminRows[0].is_admin !== 1) {
    pool.end();
    return { error: "Shopper is not an admin" };
  }

  const salesRows = await getSales();
  pool.end();

  const salesList = salesRows.map((row) => ({
    "chain-name": row.chain_name,
    "total-sales": Number(row.total_sales),
  }));

  return { "sales-list": salesList };
};