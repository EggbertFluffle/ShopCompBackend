import mysql from "mysql2";

export const handler = async (event) => {
  if (!event["shopper-uuid"]) throw new Error("Missing shopper-uuid");
  if (!event["shopper-username"]) throw new Error("Missing shopper-username");
  if (!event["shopping-list-name"]) throw new Error("Missing shopping-list-name");
  if (!event["shopping-list-uuid"]) throw new Error("Missing shopping-list-uuid");
  if (!event["item-name"]) throw new Error("Missing item-name");
  if (!event["item-uuid"]) throw new Error("Missing item-uuid");
  if (event["item-quantity"] == null) throw new Error("Missing item-quantity");
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
  const modifyItemInList = (itemUUID, listUUID, itemName, itemQuantity) => {
    return new Promise((resolve, reject) => {
      const updateQuery = `
          UPDATE \`Shopping List Item\`
          SET name = ?, quantity = ?
          WHERE uuid = ? AND \`list-uuid\` = ?;
      `;
      pool.query(updateQuery, [itemName, itemQuantity, itemUUID, listUUID], (error, results) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(results);
        }
      });
    });
  }
  const getLists = (shopperUUID) => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
          SELECT
              \`Shopping List\`.uuid AS list_uuid,
              \`Shopping List\`.name AS list_name,
              \`Shopping List Item\`.uuid AS item_uuid,
              \`Shopping List Item\`.name AS item_name,
              \`Shopping List Item\`.quantity AS item_quantity
          FROM \`Shopping List\`
          LEFT JOIN \`Shopping List Item\` 
              ON \`Shopping List\`.uuid = \`Shopping List Item\`.\`list-uuid\`
          WHERE \`Shopping List\`.\`shopper-uuid\` = ? 
          ORDER BY \`Shopping List\`.name;
      `;

      pool.query(selectQuery, [shopperUUID], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  let listsRows;
  try {
    const userRows = await getUser(event["shopper-uuid"], event["shopper-username"]);
    if (userRows.length === 0) {
      throw new Error("User not found or username does not match.");
    }
    const shoppingListRows = await getShoppingList(event["shopping-list-uuid"], event["shopping-list-name"], event["shopper-uuid"]);
    if (shoppingListRows.length === 0) {
      throw new Error("Shopping list not found for this user.");
    }
    const results = await modifyItemInList(
      event["item-uuid"],
      event["shopping-list-uuid"],
      event["item-name"],
      event["item-quantity"],
    );
    if (results.affectedRows === 0) {
      throw new Error("Item not found in the specified shopping list.");
    }
    listsRows = await getLists(event["shopper-uuid"]);
  } catch (error) {
    pool.end();
    throw error;
  }
  pool.end();

  const shoppingListMap = new Map();
  const shoppingListList = [];
  listsRows.forEach((row) => {
    let listUUID = shoppingListMap.get(row.list_uuid);
    if (!listUUID) {
      shoppingListList.push(row.list_uuid);
      let list = {
        "shopping-list-uuid": row.list_uuid,
        name: row.list_name,
        items: row.item_uuid ? [
          {
            "item-uuid": row.item_uuid,
            name: row.item_name,
            quantity: row.item_quantity
          },
        ] : [],
      };
      shoppingListMap.set(row.list_uuid, list);
    } else {
      shoppingListMap.get(row.list_uuid).items.push({
        "item-uuid": row.item_uuid,
        name: row.item_name, 
        quantity: row.item_quantity
      });
    }
  });

  return { "shopping-list": shoppingListList.map((listUUID) => shoppingListMap.get(listUUID))};
};
