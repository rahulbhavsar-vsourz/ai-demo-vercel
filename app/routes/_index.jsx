import { useState, useCallback, useEffect, useRef } from "react";
import { 
  MODELS, 
  USE_DYNAMIC_MODEL_SELECTION, 
  DEFAULT_MODEL_IDENTIFIER, 
  findBestModel 
} from "../config.js";

// Fetch recent generations from the API
const fetchRecentGenerations = async () => {
  const response = await fetch("/api/generations?limit=10");
  if (!response.ok) {
    throw new Error("Failed to fetch recent generations");
  }
  return response.json();
};

// Boolean options available in Leonardo AI API with their descriptions
const BOOLEAN_OPTIONS = [
  {
    id: "alchemy",
    label: "Alchemy",
    tooltip: "Enable Alchemy mode for enhanced image quality and more artistic outputs. Uses more compute resources.",
    default: false,
  },
  {
    id: "photoReal",
    label: "PhotoReal",
    tooltip: "Enable PhotoReal mode to generate photorealistic images. Works best with photographic prompts.",
    default: false,
    conditionalFields: [
      {
        id: "photoRealVersion",
        label: "PhotoReal Version",
        type: "select",
        options: [
          { value: "v1", label: "v1" },
          { value: "v2", label: "v2" },
        ],
        default: "v2",
      },
    ],
  },
  {
    id: "promptMagic",
    label: "Prompt Magic",
    tooltip: "Enhance your prompts with AI-powered improvements for better results. Adds creative details automatically.",
    default: false,
    conditionalFields: [
      {
        id: "promptMagicVersion",
        label: "Version",
        type: "select",
        options: [
          { value: "v2", label: "v2" },
          { value: "v3", label: "v3" },
        ],
        default: "v2",
      },
      {
        id: "promptMagicStrength",
        label: "Strength (0.1 - 1.0)",
        type: "number",
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 0.5,
      },
    ],
  },
  {
    id: "transparency",
    label: "Transparency",
    tooltip: "Generate images with transparent backgrounds. Useful for creating assets that can be composited.",
    default: false,
    valueType: "select",
    options: [
      { value: "foreground_only", label: "Foreground Only" },
    ],
  },
  {
    id: "highContrast",
    label: "High Contrast",
    tooltip: "Enable high contrast mode for images with more vivid and distinct color separation.",
    default: false,
  },
  {
    id: "highResolution",
    label: "High Resolution",
    tooltip: "Generate images at higher resolution for more detail. May increase generation time.",
    default: false,
  },
  {
    id: "expandedDomain",
    label: "Expanded Domain",
    tooltip: "Allow the model to explore a wider range of visual concepts beyond its typical training domain.",
    default: false,
  },
  {
    id: "fantasyAvatar",
    label: "Fantasy Avatar",
    tooltip: "Optimize generation for fantasy-style character avatars and portraits. Works best with character-focused prompts.",
    default: false,
  },
  {
    id: "enhancePrompt",
    label: "Enhance Prompt",
    tooltip: "Use AI to automatically enhance and expand your prompt for more detailed results.",
    default: false,
    conditionalFields: [
      {
        id: "enhancePromptInstruction",
        label: "Enhancement Instructions",
        type: "text",
        placeholder: "Optional: specific enhancement instructions",
        default: "",
      },
    ],
  },
  {
    id: "public",
    label: "Public",
    tooltip: "Make the generated images publicly visible in the Leonardo AI community gallery.",
    default: false,
  },
];

// Preset Styles available in Leonardo AI API
const PRESET_STYLES = [
  { value: "NONE", label: "None (Default)" },
  { value: "ANIME", label: "Anime" },
  { value: "BOKEH", label: "Bokeh" },
  { value: "CINEMATIC", label: "Cinematic" },
  { value: "CINEMATIC_CLOSEUP", label: "Cinematic Closeup" },
  { value: "CREATIVE", label: "Creative" },
  { value: "DYNAMIC", label: "Dynamic" },
  { value: "ENVIRONMENT", label: "Environment" },
  { value: "FASHION", label: "Fashion" },
  { value: "FILM", label: "Film" },
  { value: "FOOD", label: "Food" },
  { value: "GENERAL", label: "General" },
  { value: "HDR", label: "HDR" },
  { value: "ILLUSTRATION", label: "Illustration" },
  { value: "LEONARDO", label: "Leonardo" },
  { value: "LONG_EXPOSURE", label: "Long Exposure" },
  { value: "MACRO", label: "Macro" },
  { value: "MINIMALISTIC", label: "Minimalistic" },
  { value: "MOODY", label: "Moody" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "PORTRAIT", label: "Portrait" },
  { value: "RAYTRACED", label: "Raytraced" },
  { value: "RENDER_3D", label: "3D Render" },
  { value: "RETRO", label: "Retro" },
  { value: "SKETCH_BW", label: "Sketch B&W" },
  { value: "SKETCH_COLOR", label: "Sketch Color" },
  { value: "STOCK_PHOTO", label: "Stock Photo" },
  { value: "VIBRANT", label: "Vibrant" },
  { value: "UNPROCESSED", label: "Unprocessed" },
];

export default function ImageGenerator() {
  // Form state
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(2);
  const [presetStyle, setPresetStyle] = useState("NONE");
  const [selectedModelIdentifier, setSelectedModelIdentifier] = useState(DEFAULT_MODEL_IDENTIFIER);
  const [booleanOptions, setBooleanOptions] = useState(
    BOOLEAN_OPTIONS.reduce((acc, option) => {
      acc[option.id] = option.default;
      return acc;
    }, {})
  );
  const [conditionalValues, setConditionalValues] = useState({});

  // Get the model that will be used (either auto-selected or manually selected)
  const getActiveModel = useCallback(() => {
    if (USE_DYNAMIC_MODEL_SELECTION) {
      return findBestModel(booleanOptions);
    }
    return MODELS.find(m => m.identifier === selectedModelIdentifier) || MODELS[0];
  }, [booleanOptions, selectedModelIdentifier]);

  const activeModel = getActiveModel();

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [error, setError] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [creditCost, setCreditCost] = useState(null);
  
  // Recent generations state
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState("");
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);
  const [showRecentSidebar, setShowRecentSidebar] = useState(false);
  
  const pollingRef = useRef(null);

  // Filter out failed generations
  const successfulGenerations = recentGenerations.filter(
    (gen) => gen.status !== "FAILED"
  );

  // Fetch recent generations on mount
  useEffect(() => {
    const loadRecentGenerations = async () => {
      try {
        setIsLoadingRecent(true);
        const data = await fetchRecentGenerations();
        setRecentGenerations(data.generations || []);
      } catch (err) {
        console.error("Error loading recent generations:", err);
        setRecentError(err.message);
      } finally {
        setIsLoadingRecent(false);
      }
    };
    loadRecentGenerations();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Handle boolean option toggle
  const handleBooleanToggle = useCallback((optionId) => {
    setBooleanOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  }, []);

  // Handle conditional field change
  const handleConditionalChange = useCallback((fieldId, value) => {
    setConditionalValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  // Poll for generation status
  const pollStatus = useCallback(async (generationId) => {
    try {
      const response = await fetch(`/api/status/${generationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get status");
      }

      setGenerationStatus(data.status);
      
      // Update images progressively as they become available
      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images);
      }

      if (data.status === "COMPLETE") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setIsGenerating(false);
        // Refresh recent generations list
        fetchRecentGenerations().then(data => {
          setRecentGenerations(data.generations || []);
        }).catch(console.error);
      } else if (data.status === "FAILED") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setError("Image generation failed. Please try again.");
        setIsGenerating(false);
      }
    } catch (err) {
      console.error("Polling error:", err);
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setError(err.message);
      setIsGenerating(false);
    }
  }, []);

  // Handle form submission
  const handleGenerate = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerationStatus("STARTING");
    setGeneratedImages([]);
    setCreditCost(null);

    try {
      // Prepare the request body
      const body = {
        prompt: prompt.trim(),
        numImages,
        presetStyle,
        modelIdentifier: activeModel.identifier,
      };

      // Add boolean options
      BOOLEAN_OPTIONS.forEach(option => {
        if (booleanOptions[option.id]) {
          if (option.valueType === "select") {
            body[option.id] = conditionalValues[option.id] || option.options[0].value;
          } else {
            body[option.id] = true;
          }
          
          // Add conditional fields
          if (option.conditionalFields) {
            option.conditionalFields.forEach(field => {
              const value = conditionalValues[field.id];
              if (value !== undefined && value !== "") {
                body[field.id] = value;
              } else if (field.default !== undefined && field.default !== "") {
                body[field.id] = field.default;
              }
            });
          }
        }
      });

      console.log("Submitting:", body);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (!data.generationId) {
        throw new Error("No generation ID received");
      }

      // Store credit cost if available
      if (data.creditcost !== undefined) {
        setCreditCost(data.creditcost);
      }

      // Start polling for status
      setGenerationStatus("PENDING");
      pollingRef.current = setInterval(() => {
        pollStatus(data.generationId);
      }, 500);

      // Also poll immediately
      pollStatus(data.generationId);

    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message);
      setIsGenerating(false);
    }
  }, [prompt, numImages, presetStyle, booleanOptions, conditionalValues, pollStatus]);

  return (
    <div className="container">
      <header className="header">
        <h1>AI Image Generator</h1>
        <button 
          className="recent-toggle-btn"
          onClick={() => setShowRecentSidebar(!showRecentSidebar)}
        >
          {showRecentSidebar ? 'Hide' : 'Recent Generations'}
        </button>
      </header>

      <div className={`main-layout ${showRecentSidebar ? 'sidebar-open' : ''}`}>
        {!showRecentSidebar && (
        <div className="form-container">
        {/* Prompt Input */}
        <div className="form-group">
          <label htmlFor="prompt">Prompt / Image Instructions</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate... (e.g., 'A cinematic fantasy dragon flying over a medieval city at sunset')"
            disabled={isGenerating}
          />
        </div>

        {/* Number of Images */}
        <div className="form-group">
          <label htmlFor="numImages">Number of Images</label>
          <input
            type="number"
            id="numImages"
            value={numImages}
            onChange={(e) => setNumImages(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
            min="1"
            max="4"
            disabled={isGenerating}
          />
        </div>

        {/* Model Selection */}
        <div className="model-section">
          <h3>
            AI Model
            {USE_DYNAMIC_MODEL_SELECTION && (
              <span className="auto-badge">Auto-Select Enabled</span>
            )}
          </h3>
          
          {USE_DYNAMIC_MODEL_SELECTION ? (
            <div className="auto-model-info">
              <p className="model-selected">
                <strong>Selected Model:</strong> {activeModel.name}
              </p>
              <p className="model-description">{activeModel.description}</p>
            </div>
          ) : (
            <div className="model-grid">
              {MODELS.map(model => (
                <label
                  key={model.identifier}
                  className={`radio-wrapper ${selectedModelIdentifier === model.identifier ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.identifier}
                    checked={selectedModelIdentifier === model.identifier}
                    onChange={(e) => setSelectedModelIdentifier(e.target.value)}
                    disabled={isGenerating}
                  />
                  <div className="model-info">
                    <span className="radio-label">{model.name}</span>
                    <span className="model-desc">{model.description}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preset Styles */}
        <div className="preset-styles-section">
          <h3>Preset Style (Select One)</h3>
          <div className="preset-styles-grid">
            {PRESET_STYLES.map(style => (
              <label
                key={style.value}
                className={`radio-wrapper ${presetStyle === style.value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="presetStyle"
                  value={style.value}
                  checked={presetStyle === style.value}
                  onChange={(e) => setPresetStyle(e.target.value)}
                  disabled={isGenerating}
                />
                <span className="radio-label">{style.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Boolean Options */}
        <div className="options-section">
          <h3>Generation Options</h3>
          <div className="options-grid">
            {BOOLEAN_OPTIONS.map(option => (
              <div key={option.id} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id={option.id}
                  checked={booleanOptions[option.id]}
                  onChange={() => handleBooleanToggle(option.id)}
                  disabled={isGenerating}
                />
                <div className="checkbox-content">
                  <label className="checkbox-label" htmlFor={option.id}>
                    {option.label}
                    <span className="tooltip-icon" data-tooltip={option.tooltip}>?</span>
                  </label>
                  
                  {/* Value type select */}
                  {option.valueType === "select" && booleanOptions[option.id] && (
                    <div className="conditional-field">
                      <label>{option.label} Value</label>
                      <select
                        value={conditionalValues[option.id] || option.options[0].value}
                        onChange={(e) => handleConditionalChange(option.id, e.target.value)}
                        disabled={isGenerating}
                      >
                        {option.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Conditional Fields */}
                  {booleanOptions[option.id] && option.conditionalFields && (
                    option.conditionalFields.map(field => (
                      <div key={field.id} className="conditional-field">
                        <label htmlFor={field.id}>{field.label}</label>
                        {field.type === "select" ? (
                          <select
                            id={field.id}
                            value={conditionalValues[field.id] || field.default}
                            onChange={(e) => handleConditionalChange(field.id, e.target.value)}
                            disabled={isGenerating}
                          >
                            {field.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : field.type === "number" ? (
                          <input
                            type="number"
                            id={field.id}
                            value={conditionalValues[field.id] ?? field.default}
                            onChange={(e) => handleConditionalChange(field.id, parseFloat(e.target.value))}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            disabled={isGenerating}
                          />
                        ) : (
                          <input
                            type="text"
                            id={field.id}
                            value={conditionalValues[field.id] || field.default}
                            onChange={(e) => handleConditionalChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            disabled={isGenerating}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          type="button"
          className="generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? "Generating..." : "Generate Images"}
        </button>
      </div>
        )}

      {/* Recent Generations Section */}
      {showRecentSidebar && (
        <div className="recent-section">
          <div className="recent-section-header">
            <h2>Recent Generations</h2>
            <div className="recent-header-actions">
              <span 
                className={`collapse-icon ${isRecentExpanded ? 'expanded' : ''}`}
                onClick={() => setIsRecentExpanded(!isRecentExpanded)}
              >
                ▼
              </span>
              <button 
                className="close-sidebar-btn"
                onClick={() => setShowRecentSidebar(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        {isRecentExpanded && (
          <div className="recent-section-content">
            {isLoadingRecent ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading recent generations...</p>
              </div>
            ) : recentError ? (
              <div className="error-message">{recentError}</div>
            ) : successfulGenerations.length === 0 ? (
              <p className="no-generations">No recent generations found.</p>
            ) : (
              <div className="recent-generations-list">
                {successfulGenerations.map((generation) => (
                  <div key={generation.id} className="generation-card">
                    <div className="generation-header">
                      <p className="generation-prompt">{generation.prompt}</p>
                      <span className="generation-date">
                        {new Date(generation.createdAt).toLocaleDateString()} {new Date(generation.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {generation.generated_images && generation.generated_images.length > 0 && (
                      <div className="generation-images">
                        {generation.generated_images.map((image, idx) => (
                          <div key={image.id || idx} className="recent-image-card">
                            <img src={image.url} alt={`Generation ${idx + 1}`} />
                            <a
                              href={image.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-btn"
                            >
                              View Image
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      )}
      </div>

      {/* Generated Images - shown progressively */}
      {generatedImages.length > 0 && (
        <div className="images-section">
          <h2>
            Generated Images
            {isGenerating && ` (${generatedImages.length}/${numImages} completed)`}
            {creditCost !== null && (
              <span className="credit-cost-badge">
                {creditCost} credits used
              </span>
            )}
          </h2>
          <div className="images-grid">
            {generatedImages.map((image, index) => (
              <div key={image.id} className="image-card">
                <img src={image.url} alt={`Generated image ${index + 1}`} />
                <div className="image-card-footer">
                  <span>Image {index + 1}</span>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-btn"
                  >
                    View Image
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">
            {generatedImages.length > 0 
              ? `Generating remaining images...` 
              : `Creating your images with Leonardo AI...`}
          </p>
          <p className="status-text">Status: {generationStatus}</p>
        </div>
      )}
    </div>
  );
}
