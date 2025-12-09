import mysql from "mysql2";

export const handler = async (event) => {
  const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  });

  const getStores = () => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
          SELECT
              \`Store Chain\`.uuid AS chain_uuid,
              \`Store Chain\`.name AS chain_name,
              \`Store Chain\`.url AS chain_url,
              Store.uuid AS store_uuid,
              Store.address AS store_address
          FROM \`Store Chain\`
          LEFT JOIN Store
              ON \`Store Chain\`.uuid = Store.\`store-chain-uuid\`
          ORDER BY \`Store Chain\`.name;
      `;

      pool.query(selectQuery, (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.sqlMessage));
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  const stores = await getStores();
  pool.end();

  const chains = [];

  for (const store of stores) {
    let chain = chains.find(
      (c) => c["store-chain-uuid"] === store.chain_uuid
    );

    if (!chain) {
      chain = {
        name: store.chain_name,
        url: store.chain_url,
        "store-chain-uuid": store.chain_uuid,
        stores: [],
      };
      chains.push(chain);
    }

    if (store.store_uuid) {
      chain.stores.push({
        address: store.store_address,
        "store-uuid": store.store_uuid,
      });
    }
  }

  return { chains: chains };
};
