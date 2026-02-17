import { json } from "@remix-run/node";
import { API_KEY } from "../config.js";

export async function loader({ params }) {
  const { generationId } = params;

  if (!generationId) {
    return json({ error: "Generation ID is required" }, { status: 400 });
  }

  try {
    const statusUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Leonardo AI Status Error:", data);
      return json({ 
        error: data.error || "Failed to get generation status",
        details: data 
      }, { status: response.status });
    }

    const generation = data.generations_by_pk;
    
    if (!generation) {
      return json({ 
        error: "Generation not found" 
      }, { status: 404 });
    }

    const status = generation.status || "UNKNOWN";
    const images = generation.generated_images || [];

    return json({
      success: true,
      status,
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        nsfw: img.nsfw,
        likeCount: img.likeCount,
      })),
      prompt: generation.prompt,
      createdAt: generation.createdAt,
    });

  } catch (error) {
    console.error("Status API Error:", error);
    return json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
