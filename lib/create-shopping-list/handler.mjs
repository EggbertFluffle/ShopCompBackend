import mysql from "mysql2";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
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
  const addShoppingList = (name, shopperUUID) => {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO \`Shopping List\` (uuid, name, \`shopper-uuid\`) VALUES (?, ?, ?);
      `;
      pool.query(insertQuery, [uuidv4(), name, shopperUUID], (error, result) => {
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
  try {
    const userRows = await getUser(event["shopper-uuid"], event["shopper-username"]);
    if (userRows.length === 0) {
      throw new Error("User not found or username does not match.");
    }
  } catch (error) {
    pool.end();
    throw error;
  }
  try {
    await addShoppingList(event["shopping-list-name"], event["shopper-uuid"]);
  } catch (error) {
    pool.end();
    throw error;
  }
  let listsRows;
  try {
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
        items: [
          {
            "item-uuid": row.item_uuid,
            name: row.item_name,
            quantity: row.item_quantity
          },
        ],
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

