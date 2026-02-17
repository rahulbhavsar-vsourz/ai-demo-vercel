import { json } from "@remix-run/node";
import { API_KEY, DEFAULT_MODEL_IDENTIFIER, getModelIdByIdentifier } from "../config.js";

// Leonardo AI API Configuration
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/generations";

// Handle GET requests (return error since this endpoint only accepts POST)
export async function loader() {
  return json(
    { error: "This endpoint only accepts POST requests" },
    { status: 405 }
  );
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    
    const {
      prompt,
      numImages = 2,
      width = 1024,
      height = 1024,
      modelIdentifier = DEFAULT_MODEL_IDENTIFIER,
      presetStyle,
      // Boolean options
      alchemy,
      photoReal,
      photoRealVersion,
      promptMagic,
      promptMagicVersion,
      promptMagicStrength,
      transparency,
      public: isPublic,
      highContrast,
      highResolution,
      contrastRatio,
      expandedDomain,
      fantasyAvatar,
      enhancePrompt,
      enhancePromptInstruction,
    } = formData;

    // Resolve model identifier to actual model ID (security: IDs never exposed to client)
    const modelId = getModelIdByIdentifier(modelIdentifier);
    
    if (!modelId) {
      return json({ 
        error: "Invalid model identifier",
        details: { modelIdentifier } 
      }, { status: 400 });
    }

    // Build payload with required fields
    const payload = {
      prompt,
      modelId,
      num_images: parseInt(numImages, 10),
      width: parseInt(width, 10),
      height: parseInt(height, 10),
      public: isPublic || false,
    };

    // Add optional preset style
    if (presetStyle && presetStyle !== "NONE") {
      payload.presetStyle = presetStyle;
    }

    // Add boolean options if enabled
    if (alchemy) {
      payload.alchemy = true;
    }

    if (photoReal) {
      payload.photoReal = true;
      if (photoRealVersion) {
        payload.photoRealVersion = photoRealVersion;
      }
    }

    if (promptMagic) {
      payload.promptMagic = true;
      if (promptMagicVersion) {
        payload.promptMagicVersion = promptMagicVersion;
      }
      if (promptMagicStrength) {
        payload.promptMagicStrength = parseFloat(promptMagicStrength);
      }
    }

    if (transparency) {
      payload.transparency = transparency;
    }

    if (highContrast) {
      payload.highContrast = true;
    }

    if (highResolution) {
      payload.highResolution = true;
    }

    if (contrastRatio) {
      payload.contrastRatio = parseFloat(contrastRatio);
    }

    if (expandedDomain) {
      payload.expandedDomain = true;
    }

    if (fantasyAvatar) {
      payload.fantasyAvatar = true;
    }

    if (enhancePrompt) {
      payload.enhancePrompt = true;
      if (enhancePromptInstruction) {
        payload.enhancePromptInstruction = enhancePromptInstruction;
      }
    }

    console.log("Sending to Leonardo AI:", JSON.stringify(payload, null, 2));

    // Call Leonardo AI API
    const response = await fetch(LEONARDO_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Leonardo AI Error:", data);
      return json({ 
        error: data.error || "Failed to generate image",
        details: data 
      }, { status: response.status });
    }

    if (!data.sdGenerationJob?.generationId) {
      return json({ 
        error: "No generation ID received",
        details: data 
      }, { status: 500 });
    }

    // Extract credit cost from various possible locations in the response
    const creditCost = data.sdGenerationJob?.apiCreditCost 
      || data.cost 
      || data.apiCreditCost
      || data.sdGenerationJob?.cost;

    return json({
      success: true,
      generationId: data.sdGenerationJob.generationId,
      creditcost: creditCost,
    });

  } catch (error) {
    console.error("Generate API Error:", error);
    return json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
