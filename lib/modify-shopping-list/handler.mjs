import mysql from "mysql2";

export const handler = async (event) => {
  if (!event["shopper-uuid"]) throw new Error("Missing shopper-uuid");
  if (!event["shopper-username"]) throw new Error("Missing shopper-username");
  if (!event["shopping-list-name"]) throw new Error("Missing shopping-list-name");
  if (!event["shopping-list-uuid"]) throw new Error("Missing shopping-list-uuid");
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
          SELECT * FROM \`Shopping List\` WHERE uuid = ? AND \`shopper-uuid\` = ?;
      `;
      pool.query(selectQuery, [uuid, shopperUUID], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  const modifyShoppingList = (listUUID, shopperUUID, newName) => {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE \`Shopping List\` SET name = ? WHERE uuid = ? AND \`shopper-uuid\` = ?;
      `;
      pool.query(updateQuery, [newName, listUUID, shopperUUID], (error, result) => {
        if (error) {
          reject(new Error("Database error: " + error));
        } else {
          resolve(result);
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
    const shoppingListRows = await getShoppingList(event["shopping-list-uuid"], event["shopper-uuid"]);
    if (shoppingListRows.length === 0) {
      throw new Error("Shopping list not found or does not belong to the user.");
    }
    const result = await modifyShoppingList(event["shopping-list-uuid"], event["shopper-uuid"], event["shopping-list-name"]);
    if (result.affectedRows === 0) {
      throw new Error("Shopping list not found or does not belong to the user.");
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

