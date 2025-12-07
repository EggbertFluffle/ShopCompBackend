import mysql from "mysql2";

export const handler = async (event) => {
  const pool = mysql
    .createPool({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
    })
    .promise();

  try {
    const body = JSON.parse(event.body);
    const adminUUID = body["admin-uuid"];

    // --- CHECK ADMIN ---
    const adminCheckQuery = `
            SELECT is_admin
            FROM Shopper
            WHERE uuid = ?
        `;

    const [adminRows] = await pool.query(adminCheckQuery, [adminUUID]);

    if (adminRows.length === 0 || adminRows[0].is_admin !== 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Shopper is not an admin" }),
      };
    }

    // --- GET STORE CHAIN SALES ---
    const salesQuery = `
            SELECT 
                StoreChain.uuid AS chain_uuid,
                StoreChain.name AS chain_name,
                COALESCE(SUM(Item.price * Item.quantity), 0) AS total_sales
            FROM StoreChain
            LEFT JOIN Store
                ON StoreChain.uuid = Store.\`store-chain-uuid\`
            LEFT JOIN Receipt
                ON Store.uuid = Receipt.\`store-uuid\`
            LEFT JOIN Item
                ON Receipt.uuid = Item.\`receipt-uuid\`
            GROUP BY StoreChain.uuid, StoreChain.name
            ORDER BY StoreChain.name ASC
        `;

    const [salesRows] = await pool.query(salesQuery);

    const salesList = salesRows.map((row) => ({
      "chain-name": row.chain_name,
      "total-sales": Number(row.total_sales),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ "sales-list": salesList }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Error returning chain sales" }),
    };
  }
};
