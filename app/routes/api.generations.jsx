import { json } from "@remix-run/node";
import { API_KEY, USER_ID } from "../config.js";

// Leonardo AI API Configuration
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/generations/user";

// Handle GET requests - Get generations by user ID
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const offset = url.searchParams.get("offset") || 0;
    const limit = url.searchParams.get("limit") || 10;
    const userId = url.searchParams.get("userId") || USER_ID;

    const apiUrl = `${LEONARDO_API_URL}/${userId}?offset=${offset}&limit=${limit}`;

    const response = await fetch(apiUrl, {
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
          error: "Failed to get generations from Leonardo AI",
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Sanitize generations to remove sensitive data like modelId
    const sanitizedGenerations = (data.generations || []).map(gen => {
      const { modelId, ...safeData } = gen;
      return safeData;
    });

    return json({
      success: true,
      generations: sanitizedGenerations,
      total: sanitizedGenerations.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching generations:", error);
    return json(
      {
        error: "Failed to fetch generations",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
