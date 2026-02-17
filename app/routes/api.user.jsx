import { json } from "@remix-run/node";
import { API_KEY } from "../config.js";

// Leonardo AI API Configuration
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/me";

// Handle GET requests - Get user info including userId
export async function loader() {
  try {
    const response = await fetch(LEONARDO_API_URL, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return json(
        {
          error: "Failed to get user info from Leonardo AI",
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return json({
      success: true,
      user: data.user_details?.[0] || data,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return json(
      {
        error: "Failed to fetch user info",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
