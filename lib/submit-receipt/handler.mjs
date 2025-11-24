import mysql from "mysql2";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  const shopperUsername = event["shopper-username"];
  const shopperUUID = event["shopper-uuid"];

  const receiptDate = event.receipt.date;
  const receiptUUID = uuidv4();
  const receiptStoreUUID = event.receipt.store["store-uuid"];

  const items = event.receipt.items; //array of items

  if (!shopperUsername || !shopperUUID) {
    pool.end();
    throw new Error(
      "Error submitting receipt. Invalid shopper username or UUID."
    );
  }

  if (!receiptDate || !receiptUUID || !receiptStoreUUID || !items) {
    pool.end();
    throw new Error("Error submitting receipt. Invalid receipt data.");
  }

  const insertReceipt = () => {
    return new Promise((resolve, reject) => {
      const insertQuery =
        "INSERT INTO Receipt (uuid, `shopper-uuid`, date, `store-uuid`) VALUES (?, ?, ?, ?)";
      pool.query(
        insertQuery,
        [receiptUUID, shopperUUID, receiptDate, receiptStoreUUID],
        (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage));
          } else {
            resolve(insertResult);
          }
        }
      );
    });
  };

  const insertItem = (item) => {
    return new Promise((resolve, reject) => {
      const insertQuery =
        "INSERT INTO Item (uuid, `receipt-uuid`, name, price, quantity, category) VALUES (?, ?, ?, ?, ?, ?);";

      const itemUUID = uuidv4();

      pool.query(
        insertQuery,
        [itemUUID, receiptUUID, item.name, item.price, item.quantity, item.category],
        (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage));
          } else {
            resolve(insertResult);
          }
        }
      );
    });
  };

  await insertReceipt();
  const promises = new Array(items.length);
  items.forEach((el, ind) => {
    promises[ind] = insertItem(el);
  });
  await Promise.all(promises);

  pool.end();
  return { "receipt-uuid": receiptUUID };
};
