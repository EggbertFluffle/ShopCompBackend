import mysql from "mysql2";

export const handler = async (event) => {
    const pool = mysql.createPool({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
    });

    try {
        const getStoreChainSales = () => {
            return new Promise((resolve, reject) => {
                // const selectQuery = 

                
            });
        }

        
    }


}