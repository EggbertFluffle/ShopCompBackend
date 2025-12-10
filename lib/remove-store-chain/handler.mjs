import mysql from "mysql2";

// Create a connection pool using RDS environment variables
function createPool() {
    return mysql
        .createPool({
            host: process.env.RDS_HOST,
            user: process.env.RDS_USER,
            password: process.env.RDS_PASSWORD,
            database: process.env.RDS_DATABASE,
        })
        .promise();
}

const pool = createPool();

function buildResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE",
        },
        body: JSON.stringify(body),
    };
}

export const handler = async (event) => {
    console.log("Incoming event:", JSON.stringify(event));

    // CORS preflight
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE",
            },
            body: "",
        };
    }

    try {
        const method = event.httpMethod || "POST";
        if (method !== "DELETE" && method !== "POST") {
            return buildResponse(405, { message: "Method not allowed" });
        }

        let storeChainUUID = null;

        // 1) Body
        if (event.body) {
            const body =
                typeof event.body === "string" ? JSON.parse(event.body) : event.body;
            storeChainUUID =
                body.storeChainUUID ||
                body["storeChainUUID"] ||
                body["store-chain-uuid"] ||
                null;
        }

        // 2) Query string fallback
        if (!storeChainUUID && event.queryStringParameters) {
            storeChainUUID =
                event.queryStringParameters.storeChainUUID ||
                event.queryStringParameters["store-chain-uuid"] ||
                null;
        }

        if (!storeChainUUID) {
            return buildResponse(400, {
                message: "Missing required field: storeChainUUID",
            });
        }

        console.log("Removing store chain with UUID:", storeChainUUID);

        // ⚠️ Make sure these match your actual DB schema
        const sql =
            "DELETE FROM `store_chain` WHERE `store-chain-uuid` = ?";

        const [result] = await pool.query(sql, [storeChainUUID]);

        console.log("Delete result:", result);

        if (result.affectedRows === 0) {
            return buildResponse(404, {
                message: "Store chain not found",
                storeChainUUID,
            });
        }

        return buildResponse(200, {
            message: "Store chain removed successfully",
            storeChainUUID,
        });
    } catch (error) {
        console.error("Error removing store chain:", error);

        return buildResponse(500, {
            message: "Internal server error while removing store chain",
            error: error.message,
        });
    }
};
