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
          SELECT * FROM \`Item\` WHERE LOWER(name) = LOWER(?); 
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
    if (!item["item-name"]) throw new Error("Missing item-name");
    const itemRows =  await getItem(item["item-name"]);
    const itemList = itemRows.map((row) => ({
      uuid: row.uuid,
      name: row.name,
      price: row.price,
      quantity: row.quantity
    }));
    return {
      "item-uuid": item["item-uuid"],
      "item-name": item["item-name"],
      "item-details": itemList
    };
  });
  const options = await Promise.all(results);
  return { "shoppint-list-uuid": event["shopping-list-uuid"], "items": options };
};

