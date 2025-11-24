// lib/show-admin-dashboard/handler.mjs

/**
 * Lambda handler for /show-admin-dashboard
 *
 * Expects JSON body:
 * {
 *   "admin-username": "admin",
 *   "admin-uuid": "00000000-0000-0000-0000-adminadmin000"
 * }
 */
export const handler = async (event) => {
    console.log("Received event for show-admin-dashboard (raw):", JSON.stringify(event));

    // ---- Parse incoming body ----
    let body = {};

    try {
        if (typeof event === "string") {
            body = JSON.parse(event);
        } else if (event && typeof event.body === "string") {
            body = JSON.parse(event.body);
        } else if (event && typeof event === "object") {
            body = event;
        }
    } catch (err) {
        console.error("Failed to parse event body as JSON:", err);
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Invalid JSON body" }),
        };
    }

    const username = body["admin-username"];
    const adminUuid = body["admin-uuid"];

    // Basic validation
    if (!username || !adminUuid) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Missing administrator username or uuid" }),
        };
    }

    const HARDCODED_ADMIN_USERNAME = "admin";
    const HARDCODED_ADMIN_UUID = "00000000-0000-0000-0000-adminadmin000";

    // Hard-coded admin check
    if (username !== HARDCODED_ADMIN_USERNAME || adminUuid !== HARDCODED_ADMIN_UUID) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Administrator does not exist" }),
        };
    }

    // ---------- Hard-coded dashboard data ----------
    const responseBody = {
        summary: {
            "store-chain-count": "3",
            "store-count": "10",
            "receipt-count": "125",
            "active-shoppers": "45",
        },
        "store-chains": [
            {
                name: "BJ's",
                url: "https://www.bjs.com",
                "store-chain-uuid": "84896baf-81c0-46bd-a34c-c3fc1f73ee9c",
                stores: [
                    {
                        address: "10 Maple St. Worcester",
                        "store-uuid": "0b40c430-c729-41b3-be2d-bd338ff847bc",
                    },
                ],
            },
            {
                name: "Walmart",
                url: "https://www.walmart.com",
                "store-chain-uuid": "098d9bcc-5eee-4d4c-a820-1089bf196230",
                stores: [
                    {
                        address: "123 Main St. Boston",
                        "store-uuid": "f7a3fac4-7846-45c2-aefe-3e45e56548bf",
                    },
                    {
                        address: "5 Park Ave. Worcester",
                        "store-uuid": "83624234-08e4-474b-af0f-3ce98a40f393",
                    },
                ],
            },
            {
                name: "Trader Joe's",
                url: "https://www.traderjoes.com",
                "store-chain-uuid": "e40842a2-cb70-4499-a9bf-dfc4b6f84d79",
                stores: [],
            },
        ],
    };

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(responseBody),
    };
};
