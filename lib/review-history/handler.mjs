import mysql from "mysql2";

export const handler = async (event) => {
  let result;
  let code;

  const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  const shopperUUID = event["shopper-uuid"];

  try {
    const getReceipts = () => {
        return new Promise((resolve, reject) => {
            const selectQuery = `
            SELECT
                Receipt.uuid AS receipt_uuid,
                Receipt.date AS receipt_date,

                Store.uuid AS store_uuid,
                Store.address AS store_address,

                Item.uuid AS item_uuid,
                Item.name AS item_name,
                Item.category AS item_category,
                Item.price AS item_price,
                Item.quantity AS item_quantity

            FROM Receipt
            JOIN Store
                ON Receipt.\`store-uuid\` = Store.uuid
            LEFT JOIN Item
                ON Receipt.uuid = Item.\`receipt-uuid\`
            WHERE Receipt.\`shopper-uuid\` = ?
            ORDER BY Receipt.date DESC;
            `;

            pool.query(selectQuery, [shopperUUID], (error, rows) => {
              if (error) {
                reject(new Error("Database error: " + error.sqlMessage));
              } else {
                resolve(rows || []);
              }
            });
        });
    }

    const receipts = await getReceipts();
    pool.end();

    const receiptsArr = [];

    for (const row of receipts) {
    let receipt = receiptsArr.find(r => r["receipt-uuid"] === row.receipt_uuid); //if exists already

    //if not then we make it
    if (!receipt) {
        receipt = {
        "receipt-uuid": row.receipt_uuid,
        date: row.receipt_date,
        store: {
            "store-uuid": row.store_uuid,
            address: row.store_address
        },
        items: []
        };
        receiptsArr.push(receipt);
    }

    // adding items
    if (row.item_uuid) {
        receipt.items.push({
        "item-uuid": row.item_uuid,
        name: row.item_name,
        category: row.item_category,
        price: String(row.item_price),
        quantity: String(row.item_quantity)
        });
    }
    }

    result = { receipts: receiptsArr };
    code = 200;


  } catch (error) {
    result = { error: error.message };
    code = 400;
  }

  return {
    statusCode: code,
    body: JSON.stringify(result),
  };
}