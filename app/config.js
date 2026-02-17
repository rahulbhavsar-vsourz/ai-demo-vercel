// =========================================
// LEONARDO AI IMAGE GENERATOR CONFIGURATION
// =========================================

// When true: Automatically selects the best model based on enabled options
// When false: Uses the DEFAULT_MODEL_IDENTIFIER for all generations
export const USE_DYNAMIC_MODEL_SELECTION = true;

// Default model identifier (used when USE_DYNAMIC_MODEL_SELECTION is false)
export const DEFAULT_MODEL_IDENTIFIER = "lightning-xl";

// Internal: Actual model IDs (not exposed to client)
const DEFAULT_MODEL_ID = "b24e16ff-06e3-43eb-8d33-4416c2d75876"; // Leonardo Lightning XL

// Leonardo AI API Key
export const API_KEY = "f6b2fa19-40c5-4974-820e-868a4c70218b";

// Leonardo AI User ID (used for fetching generations by user)
export const USER_ID = "ab9be29b-c841-4063-b823-d170e66bc97a";

// =========================================
// AVAILABLE MODELS AND THEIR CAPABILITIES
// =========================================
// Internal models with actual IDs (server-side only)
const MODELS_INTERNAL = [
  {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
    identifier: "lightning-xl",
    name: "Leonardo Lightning XL",
    description: "Fast generation, good for quick iterations",
    supports: {
      transparency: false,
      enhancePrompt: true,
      promptMagic: true,
      alchemy: true,
      photoReal: false,
      highContrast: true,
      highResolution: true,
      expandedDomain: false,
      fantasyAvatar: false,
    },
    isDefault: true,
    priority: 1, // Lower number = higher priority
  },
  {
    id: "aa77f04e-3eec-4034-9c07-d0f619684628",
    identifier: "kino-xl",
    name: "Leonardo Kino XL",
    description: "Cinematic style, great for movie-like images",
    supports: {
      transparency: true,
      enhancePrompt: true,
      promptMagic: true,
      alchemy: true,
      photoReal: true,
      highContrast: true,
      highResolution: true,
      expandedDomain: true,
      fantasyAvatar: true,
    },
    priority: 2, // Supports transparency + all other features
  },
  {
    id: "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",
    identifier: "phoenix-1.0",
    name: "Leonardo Phoenix 1.0",
    description: "Latest Phoenix model, versatile and high quality",
    supports: {
      transparency: true,
      enhancePrompt: true,
      promptMagic: false,
      alchemy: true,
      photoReal: true,
      highContrast: true,
      highResolution: true,
      expandedDomain: true,
      fantasyAvatar: true,
    },
    priority: 5, // Phoenix models - no Prompt Magic
  },
  {
    id: "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
    identifier: "phoenix-0.9",
    name: "Leonardo Phoenix 0.9",
    description: "Stable Phoenix model, good balance of speed and quality",
    supports: {
      transparency: true,
      enhancePrompt: true,
      promptMagic: false,
      alchemy: true,
      photoReal: true,
      highContrast: true,
      highResolution: true,
      expandedDomain: true,
      fantasyAvatar: true,
    },
    priority: 6, // Phoenix models - no Prompt Magic
  },
  {
    id: "5c232a9e-9061-4777-980a-ddc8e65647c6",
    identifier: "vision-xl",
    name: "Leonardo Vision XL",
    description: "High detail model, excellent for complex scenes",
    supports: {
      transparency: true,
      enhancePrompt: true,
      promptMagic: true,
      alchemy: true,
      photoReal: false,
      highContrast: true,
      highResolution: true,
      expandedDomain: true,
      fantasyAvatar: true,
    },
    priority: 3, // Supports transparency + most features
  },
  {
    id: "2067ae52-33fd-4a82-bb92-c2c55e7d2786",
    identifier: "albedo-xl",
    name: "AlbedoBase XL",
    description: "Community model, versatile base model",
    supports: {
      transparency: false,
      enhancePrompt: true,
      promptMagic: true,
      alchemy: true,
      photoReal: false,
      highContrast: true,
      highResolution: true,
      expandedDomain: true,
      fantasyAvatar: false,
    },
    priority: 4, // No transparency support
  },
];

// Client-safe models (without actual IDs - for UI display only)
export const MODELS = MODELS_INTERNAL.map(({ id, ...rest }) => rest);

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Get actual model ID by identifier (server-side only)
 * @param {string} identifier - The model identifier/slug
 * @returns {string|null} - The actual model ID or null if not found
 */
export function getModelIdByIdentifier(identifier) {
  const model = MODELS_INTERNAL.find(m => m.identifier === identifier);
  return model ? model.id : null;
}

/**
 * Get model by identifier (server-side - returns full model with ID)
 * @param {string} identifier - The model identifier/slug
 * @returns {Object|undefined} - The model object or undefined
 */
export function getModelByIdentifier(identifier) {
  return MODELS_INTERNAL.find(m => m.identifier === identifier);
}

/**
 * Find the best model based on enabled options
 * @param {Object} enabledOptions - Object with boolean flags for each option
 * @returns {Object} - The best matching model (client-safe, with identifier)
 */
export function findBestModel(enabledOptions) {
  if (!USE_DYNAMIC_MODEL_SELECTION) {
    return MODELS.find(m => m.identifier === DEFAULT_MODEL_IDENTIFIER) || MODELS[0];
  }

  // Get list of required features from enabled options
  const requiredFeatures = Object.entries(enabledOptions)
    .filter(([key, value]) => value === true)
    .map(([key]) => key);

  // If no special features needed, return default model
  if (requiredFeatures.length === 0) {
    return MODELS.find(m => m.identifier === DEFAULT_MODEL_IDENTIFIER) || MODELS[0];
  }

  // Find models that support all required features
  const compatibleModels = MODELS.filter(model => {
    return requiredFeatures.every(feature => model.supports[feature]);
  });

  // If no compatible model found, return default with a warning
  if (compatibleModels.length === 0) {
    console.warn("No model supports all selected features. Using default model.");
    return MODELS.find(m => m.identifier === DEFAULT_MODEL_IDENTIFIER) || MODELS[0];
  }

  // Sort compatible models by priority (lower number = higher priority)
  // Then by number of supported features (more = better)
  const sortedModels = compatibleModels.sort((a, b) => {
    // First, prioritize by priority value if defined
    const priorityA = a.priority || 999;
    const priorityB = b.priority || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, prefer model that supports more features
    const featuresA = Object.values(a.supports).filter(v => v === true).length;
    const featuresB = Object.values(b.supports).filter(v => v === true).length;
    return featuresB - featuresA;
  });

  return sortedModels[0];
}

/**
 * Get model by ID (internal use only)
 * @param {string} modelId - The model ID
 * @returns {Object|undefined} - The model object or undefined
 */
export function getModelById(modelId) {
  return MODELS_INTERNAL.find(m => m.id === modelId);
}

/**
 * Check if a model supports specific features
 * @param {string} modelId - The model ID
 * @param {string[]} features - Array of feature names to check
 * @returns {boolean} - True if model supports all features
 */
export function modelSupportsFeatures(modelId, features) {
  const model = getModelById(modelId);
  if (!model) return false;
  return features.every(feature => model.supports[feature]);
}

