// lib/login-administrator/handler.mjs

/**
 * Lambda handler for /login-administrator
 *
 * Expects JSON body:
 * {
 *   "admin-username": "admin",
 *   "password": "goat123"
 * }
 */
export const handler = async (event) => {
    console.log("Received event (raw):", JSON.stringify(event));

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
            body: JSON.stringify({
                state: "error",
                message: "Invalid JSON body for login-administrator",
            }),
        };
    }

    const username = body["admin-username"];
    const password = body["password"];

    console.log("Parsed login body:", { username, hasPassword: !!password });

    // Basic validation
    if (!username || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                state: "error",
                message: "Missing admin-username or password",
            }),
        };
    }

    // ---- Hard-coded admin credentials ----
    const HARDCODED_ADMIN_USERNAME = "admin";
    const HARDCODED_ADMIN_PASSWORD = "goat123";
    const HARDCODED_ADMIN_UUID = "00000000-0000-0000-0000-adminadmin000";

    if (username !== HARDCODED_ADMIN_USERNAME || password !== HARDCODED_ADMIN_PASSWORD) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                state: "error",
                message: "Wrong username or password",
            }),
        };
    }

    // Success — return admin uuid
    return {
        statusCode: 200,
        body: JSON.stringify({
            "admin-uuid": HARDCODED_ADMIN_UUID,
            state: "success",
            message: "Logged in successfully",
        }),
    };
};
