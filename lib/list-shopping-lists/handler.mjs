
import mysql from "mysql2";

export const handler = async (event) => {
  const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  const getLists = () => {
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

      pool.query(selectQuery, [event["shopper-uuid"]], (error, rows) => {
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
    listsRows = await getLists();
  } finally {
    pool.end();
  }

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

