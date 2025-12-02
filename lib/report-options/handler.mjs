import mysql from "mysql2";

export const handler = async (event) => {
  if (!event["shopper-uuid"]) throw new Error("Missing shopper-uuid");
  if (!event["shopper-username"]) throw new Error("Missing shopper-username");
  if (!event["shopping-list-name"]) throw new Error("Missing shopping-list-name");
  if (!event["shopping-list-uuid"]) throw new Error("Missing shopping-list-uuid");
  if (!event["items"]) throw new Error("Missing items");
  const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });
  const getUser = (uuid, username) => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
          SELECT * FROM \`Shopper\` WHERE uuid = ? AND username = ?;
      `;
      pool.query(selectQuery, [uuid, username], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  const getShoppingList = (uuid, name, shopperUUID) => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
          SELECT * FROM \`Shopping List\` WHERE uuid = ? AND name = ? AND \`shopper-uuid\` = ?;
      `;
      pool.query(selectQuery, [uuid, name, shopperUUID], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  const getItem = (itemName) => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
          SELECT 
              Item.uuid AS \`item-uuid\`,
              Item.name AS \`item-name\`,
              Item.quantity AS \`item-quantity\`,
              Item.price AS \`item-price\`,
              Receipt.uuid AS \`receipt-uuid\`,
              Receipt.date AS \`receipt-date\`,
              \`Store Chain\`.uuid AS \`store-chain-uuid\`,
              \`Store Chain\`.name AS \`store-chain-name\`,
              \`Store Chain\`.url AS \`store-chain-url\`,
              Store.uuid AS \`store-uuid\`,
              Store.address AS \`store-address\`
          FROM Item
          LEFT JOIN Receipt ON Item.\`receipt-uuid\` = Receipt.uuid
          LEFT JOIN Store ON Receipt.\`store-uuid\` = Store.uuid
          LEFT JOIN \`Store Chain\` ON Store.\`store-chain-uuid\` = \`Store Chain\`.uuid
          WHERE LOWER(Item.name) = LOWER(?);
        `;      
        pool.query(selectQuery, [itemName], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  try {
    let userRows = getUser(event["shopper-uuid"], event["shopper-username"]);
    let listRows = getShoppingList(event["shopping-list-uuid"], event["shopping-list-name"], event["shopper-uuid"]);
    userRows = await userRows;
    listRows = await listRows;
    if (userRows.length === 0) throw new Error("Shopper not found");
    if (listRows.length === 0) throw new Error("Shopping list not found");
  } catch (error) {
    throw error;
  }
  const items = event["items"];
  const results = items.map(async (item) => {
    if (!item["item-uuid"]) throw new Error("Missing item-uuid");
    if (!item.name) throw new Error("Missing item-name");
    const itemRows =  await getItem(item.name);
    const itemList = itemRows.map((row) => ({
      "item-uuid": row["item-uuid"],
      name: row["item-name"],
      price: row["item-price"],
      quantity: row["item-quantity"],
      "receipt-uuid": row["receipt-uuid"],
      receipt: {
        date: row["receipt-date"],
        "store-chain-uuid": row["store-chain-uuid"],
        "store-chain-name": row["store-chain-name"],
        "store-chain-url": row["store-chain-url"],
        store: {
          "store-uuid": row["store-uuid"],
          address: row["store-address"],
        },
      },
    }));
    return {
      "item-uuid": item["item-uuid"],
      "name": item.name,
      "options": itemList
    };
  });
  const options = await Promise.all(results);
  return { "shopping-list-uuid": event["shopping-list-uuid"], "items": options };
};

