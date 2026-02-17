# Leonardo AI Image Generator - Documentation

## Project Overview
A full-stack web application built with Remix.run that provides an intuitive interface for generating AI images using the Leonardo.ai API. The application features real-time status updates, recent generation history with animations, credit cost tracking, and comprehensive customization options with enhanced security.

**Key Features:**
- 🔒 Secure model identifier system (model IDs never exposed to client)
- 💎 Credit cost tracking and display
- 🎨 Recent generations sidebar with smooth animations
- ⚡ Real-time status polling with progressive image display
- 🎯 Intelligent model auto-selection based on enabled features
- 📱 Responsive design with light theme

---

## Recent Changes (v2.0.0 - Security Enhanced)

### 🔒 Security Architecture Overhaul
- **Model ID Protection**: Implemented two-tier model storage system
  - Client-side uses safe identifiers (e.g., "lightning-xl")
  - Server-side resolves to actual Leonardo model IDs
  - Model IDs never visible in browser DevTools network tab
- **API Sanitization**: All API responses strip `modelId` before sending to client
- **Validation Layer**: Server validates all incoming identifiers with 400 errors for invalid requests

### 💎 Credit Cost Tracking
- Real-time credit cost display with purple gradient badge
- Extracted from Leonardo API responses automatically
- Positioned next to "Generated Images" heading
- Fade-in animation for smooth appearance

### 🎨 UI/UX Enhancements
- **Animation System**: 
  - slideInFromLeft/Right for section transitions (0.4s)
  - fadeIn for content reveals (0.3s)
  - scaleIn for card appearances (0.3s)
- **Light Theme**: Gradient backgrounds (#f0f4f8 → #cbd5e1)
- **Recent Generations**: Redesigned cards with prompt left-aligned, date right-aligned
- **Toggle Functionality**: Hide/show form and sidebar with smooth transitions

### 📊 Model Support Matrix Updates
- Updated transparency support (Kino XL, Vision XL, Phoenix models)
- Refined alchemy, promptMagic, and highContrast compatibility
- Priority-based model selection (1=highest: Lightning XL)

### 🛡️ Comprehensive Security
- `api.generate.jsx`: Identifier validation and server-side ID resolution
- `api.status.$generationId.jsx`: ModelId stripped from responses
- `api.generations.jsx`: Bulk sanitization of generation history
- All sensitive IDs kept server-side only

---

## Technology Stack

### Frontend
- **Framework**: Remix.run v2.15.0
- **UI Library**: React 18.3.1
- **Build Tool**: Vite 5.4.11
- **Styling**: Custom CSS with hardware-accelerated animations

### Backend
- **Runtime**: Node.js >= 20.0.0
- **Framework**: Remix.run (Server-side rendering)
- **API Communication**: Native Fetch API
- **Security**: Server-side model ID resolution

### Third-Party Services
- **Leonardo.ai API** (https://cloud.leonardo.ai/api/rest/v1/)
  - Purpose: AI image generation platform
  - Authentication: Bearer token (API Key)
  - Version: REST API v1
  - Features Used:
    - Image generation with cost tracking
    - Generation status polling
    - User information retrieval
    - Generation history by user

---

## Configuration

### Configuration File: `app/config.js`

#### API Credentials
```javascript
API_KEY = "f6b2fa19-40c5-4974-820e-868a4c70218b"
USER_ID = "ab9be29b-c841-4063-b823-d170e66bc97a"
```

⚠️ **Security Note**: These should be moved to environment variables in production.

#### Model Selection Settings
- **USE_DYNAMIC_MODEL_SELECTION**: `false` (can be toggled)
  - When `true`: Automatically selects the best model based on enabled features
  - When `false`: Uses the DEFAULT_MODEL_IDENTIFIER for all generations

- **DEFAULT_MODEL_IDENTIFIER**: `"lightning-xl"` (Leonardo Lightning XL)

#### Security Architecture

The application uses a **dual-model storage system** for enhanced security:

**Client-Side (Exported to Frontend):**
```javascript
export const MODELS = [
  {
    identifier: "lightning-xl",  // Safe slug
    name: "Leonardo Lightning XL",
    description: "...",
    supports: { ... },
    priority: 1
  }
  // Model IDs are NOT included
]
```

**Server-Side (Internal Only):**
```javascript
const MODELS_INTERNAL = [
  {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",  // Actual ID
    identifier: "lightning-xl",
    name: "Leonardo Lightning XL",
    // ...
  }
]
```

#### Available Models (with Priority Ranking)

1. **Leonardo Lightning XL** (Priority 1 - Default)
   - Identifier: `lightning-xl`
   - Fast generation, good for quick iterations
   - Supports: Alchemy, Prompt Magic, High Contrast, High Resolution
   - Does NOT support: Transparency, PhotoReal

2. **Leonardo Kino XL** (Priority 2 - Best for Transparency)
   - Identifier: `kino-xl`
   - Cinematic style, great for movie-like images
   - Supports: **Transparency** + All features including PhotoReal and Alchemy
   - Most versatile option

3. **Leonardo Vision XL** (Priority 3 - High Detail)
   - Identifier: `vision-xl`
   - High detail model for complex scenes
   - Supports: **Transparency**, Alchemy, Prompt Magic, High Contrast, High Resolution
   - Does NOT support: PhotoReal

4. **AlbedoBase XL** (Priority 4 - Community)
   - Identifier: `albedo-xl`
   - Community model, versatile base
   - Supports: Alchemy, Prompt Magic, High Contrast, High Resolution
   - Does NOT support: Transparency, PhotoReal

5. **Leonardo Phoenix 1.0** (Priority 5)
   - Identifier: `phoenix-1.0`
   - Latest model, versatile and high quality
   - Supports: Transparency, Alchemy, PhotoReal, High Contrast, High Resolution
   - Does NOT support: Prompt Magic

6. **Leonardo Phoenix 0.9** (Priority 6)
   - Identifier: `phoenix-0.9`
   - Stable Phoenix model, balanced speed and quality
   - Supports: Transparency, Alchemy, PhotoReal, High Contrast, High Resolution
   - Does NOT support: Prompt Magic

#### Helper Functions
- `findBestModel(enabledOptions)`: Returns client-safe model with identifier
- `getModelIdByIdentifier(identifier)`: Server-side conversion to actual ID
- `getModelByIdentifier(identifier)`: Server-side full model retrieval
- `getModelById(modelId)`: Internal model lookup by actual ID
- `modelSupportsFeatures(modelId, features)`: Feature compatibility check

---

## API Endpoints

### 1. Generate Image
**Endpoint**: `/api/generate`  
**Method**: POST  
**Purpose**: Create a new AI image generation request

**Security**: Client sends model identifier, server resolves to actual ID

**Request Body**:
```json
{
  "prompt": "A cinematic fantasy dragon",
  "numImages": 2,
  "width": 1024,
  "height": 1024,
  "modelIdentifier": "lightning-xl",
  "presetStyle": "CINEMATIC",
  "alchemy": true,
  "photoReal": false,
  "photoRealVersion": "v2",
  "promptMagic": true,
  "promptMagicVersion": "v3",
  "promptMagicStrength": 0.5,
  "transparency": "foreground_only",
  "public": false,
  "highContrast": true,
  "highResolution": true,
  "contrastRatio": 0.5,
  "expandedDomain": true,
  "fantasyAvatar": false,
  "enhancePrompt": true,
  "enhancePromptInstruction": "Make it more detailed"
}
```

**Server-Side Processing**:
1. Client sends `modelIdentifier` (e.g., "lightning-xl")
2. Server calls `getModelIdByIdentifier(modelIdentifier)`
3. Server validates identifier, returns 400 if invalid
4. Server uses actual model ID for Leonardo API call
5. Actual model ID **never returned** to client

**Response**:
```json
{
  "success": true,
  "generationId": "abc-123-def-456",
  "creditcost": 8
}
```

**Success Response Fields**:
- `success`: Boolean indicating operation success
- `generationId`: Unique identifier for tracking generation status
- `creditcost`: Number of Leonardo credits consumed for this generation

**Error Response** (400 - Invalid Identifier):
```json
{
  "error": "Invalid model identifier"
}
```

**Leonardo API**: `POST https://cloud.leonardo.ai/api/rest/v1/generations`

**Credit Cost Extraction**: Server checks multiple response locations:
- `data.sdGenerationJob.apiCreditCost`
- `data.cost`
- `data.creditCost`
- `data.apiCreditCost`

---

### 2. Check Generation Status
**Endpoint**: `/api/status/:generationId`  
**Method**: GET  
**Purpose**: Poll the status of an ongoing generation

**Security**: Model ID is **NOT** included in response

**URL Parameters**:
- `generationId` (required): The generation ID returned from generate endpoint

**Response**:
```json
{
  "success": true,
  "status": "COMPLETE",
  "images": [
    {
      "id": "img-123",
      "url": "https://cdn.leonardo.ai/...",
      "nsfw": false,
      "likeCount": 0
    }
  ],
  "prompt": "A cinematic fantasy dragon",
  "createdAt": "2026-02-17T10:30:00Z"
}
```

**Response Fields**:
- `success`: Boolean indicating operation success
- `status`: Current generation status (see values below)
- `images`: Array of generated image objects (when COMPLETE)
- `prompt`: Original prompt text
- `createdAt`: ISO 8601 timestamp of generation creation

**Status Values**:
- `PENDING`: Generation in progress
- `COMPLETE`: Generation finished successfully
- `FAILED`: Generation failed

**Leonardo API**: `GET https://cloud.leonardo.ai/api/rest/v1/generations/{generationId}`

**Security Note**: The server receives modelId from Leonardo but strips it before sending response to client.

---

### 3. Get User Information
**Endpoint**: `/api/user`  
**Method**: GET  
**Purpose**: Retrieve authenticated user details including User ID

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "ab9be29b-c841-4063-b823-d170e66bc97a",
    "username": "user123",
    "email": "user@example.com"
  }
}
```

**Leonardo API**: `GET https://cloud.leonardo.ai/api/rest/v1/me`

---

### 4. Get Recent Generations
**Endpoint**: `/api/generations`  
**Method**: GET  
**Purpose**: Fetch user's recent generation history

**Security**: Model IDs are **sanitized** before returning to client

**Query Parameters**:
- `offset` (optional, default: 0): Pagination offset
- `limit` (optional, default: 10): Number of generations to retrieve
- `userId` (optional): User ID (uses config USER_ID if not provided)

**Response**:
```json
{
  "success": true,
  "generations": [
    {
      "id": "gen-123",
      "prompt": "A cinematic fantasy dragon",
      "status": "COMPLETE",
      "createdAt": "2026-02-17T10:30:00Z",
      "generated_images": [
        {
          "id": "img-123",
          "url": "https://cdn.leonardo.ai/..."
        }
      ]
    }
  ],
  "total": 8,
  "offset": 0,
  "limit": 10
}
```

**Security Sanitization**: Server strips `modelId` from all generation objects:
```javascript
const sanitizedGenerations = (data.generations || []).map(gen => {
  const { modelId, ...safeData } = gen;
  return safeData;
});
}
```

**Leonardo API**: `GET https://cloud.leonardo.ai/api/rest/v1/generations/user/{userId}`

---

## Application Features

### 1. Image Generation Form
**Components**:
- **Prompt Input**: Text area for describing desired image
- **Number of Images**: Select 1-4 images per generation
- **Model Selection**: 
  - Uses safe model **identifiers** (e.g., "lightning-xl")
  - Manual selection (when USE_DYNAMIC_MODEL_SELECTION = false)
  - Auto-selection based on enabled features (when true)
  - Model IDs never exposed to client
- **Preset Styles**: Choose from predefined artistic styles
- **Advanced Options**: Toggle various AI enhancement features

**Security Note**: Model selection dropdown shows user-friendly names but internally uses secure identifiers that map to actual model IDs server-side only.

**Available Boolean Options**:
1. **Alchemy**: Enhanced image quality and artistic outputs
2. **PhotoReal**: Generate photorealistic images
   - Version: v1 or v2
3. **Prompt Magic**: AI-powered prompt enhancement
   - Version: v2 or v3
   - Strength: 0.1 - 1.0
4. **Transparency**: Generate images with transparent backgrounds
5. **High Contrast**: Increase image contrast
6. **High Resolution**: Generate higher resolution outputs
7. **Expanded Domain**: Access to expanded generation capabilities
8. **Fantasy Avatar**: Specialized mode for fantasy character creation
9. **Enhance Prompt**: Improve prompts with AI suggestions

---

### 2. Real-Time Status Updates
**Features**:
- Automatic polling every 2 seconds during generation
- Status indicators: "Generating...", "Complete"
- Error handling with detailed messages
- Automatic polling cleanup on completion or error

**Implementation**:
- Uses React `useRef` to manage polling interval
- Prevents memory leaks with cleanup on unmount
- Updates UI in real-time with generation progress

---

### 3. Generated Images Display
**Features**:
- Responsive grid layout
- **Credit Cost Badge**: Displays credits consumed for the generation
  - Purple gradient styling (#667eea → #764ba2)
  - Positioned next to "Generated Images" heading
  - Fade-in animation (0.5s)
  - Automatically hidden when no images
- Image preview cards with:
  - Full-size image display
  - "View Image" button (opens in new tab)
  - Smooth animations (scale-in effect)
  - Hover effects with shadow enhancement

**Credit Cost Display**:
```jsx
{creditCost !== null && (
  <span className="credit-cost-badge">
    {creditCost} credits used
  </span>
)}
```

**Styling**:
- Badge: Purple gradient background, white text, rounded corners
- Position: Inline with h2 heading, flexbox with gap
- Animation: Fade in with opacity transition

**Responsive Breakpoints**:
- Desktop: Grid with auto-fit columns (min 150px)
- Tablet (< 1200px): Adjusted layout
- Mobile (< 768px): Single column stack

---

### 4. Credit Cost Tracking

**Purpose**: Track and display Leonardo.ai credit consumption per generation

**Implementation**:
- Server extracts credit cost from multiple Leonardo API response locations:
  - `data.sdGenerationJob.apiCreditCost`
  - `data.cost`
  - `data.creditCost`
  - `data.apiCreditCost`
- Client stores cost in `creditCost` state variable
- Badge displayed next to "Generated Images" heading

**Visual Design**:
```css
.credit-cost-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  animation: fadeIn 0.5s ease-out;
}
```

**Data Flow**:
1. User submits generation request
2. Server receives credit cost from Leonardo API
3. Server returns `creditcost` to client (safe, non-sensitive data)
4. Client updates `creditCost` state
5. Badge appears with fade-in animation
6. Badge hidden when no images generated

**Example Response**:
```json
{
  "success": true,
  "generationId": "abc-123",
  "creditcost": 8
}
```

---

### 5. Recent Generations Sidebar
**Features**:
- Toggle button to show/hide sidebar
- Displays last 10 generations (configurable)
- Filters out FAILED generations automatically
- Collapse/expand content within sidebar
- Full-width display when form is hidden

**Displayed Information**:
- Prompt text (left-aligned)
- Date and time (right-aligned)
- Generated images with "View Image" links
- Smooth slide-in/out animations

**Animations**:
- Slide in from right (0.4s ease-out)
- Slide in from left for form (0.4s ease-out when sidebar hides)
- Content fade-in (0.3s)
- Card scale-in effect (0.3s)
- Interactive hover states (scale 1.02)
- Credit badge fade-in (0.5s)

**Keyframe Animations**:
```css
@keyframes slideInFromRight {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInFromLeft {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

**User Actions**:
- Click "Recent Generations" button: Hides form, shows sidebar full-width
- Click "Hide" or "✕" button: Shows form, hides sidebar
- Click "▼" icon: Collapses/expands content

---

### 6. UI/UX Enhancements

#### Theme
- **Color Scheme**: Light theme
- **Background**: Linear gradient (#f0f4f8 → #e2e8f0 → #cbd5e1)
- **Primary Colors**: 
  - Gradient accent: #e94560 → #f5af19
  - Text: #1a202c (primary), #334155 (secondary), #64748b (muted)
- **Borders**: #e2e8f0, #cbd5e1

#### Animations
- **Section Transitions**: Slide from left/right (0.4s)
- **Content Display**: Fade-in (0.3s)
- **Cards**: Scale-in effect (0.3s)
- **Buttons**: Scale on hover (1.05-1.1x)
- **Images**: Lift effect on hover

#### Responsive Design
- Sticky positioning for form and sidebar
- Fluid layouts with flexbox and grid
- Mobile-first approach with media queries
- Optimized for 1920px+ (desktop), 768-1200px (tablet), <768px (mobile)

---

## File Structure

```
leonardo-image-app/
├── app/
│   ├── config.js                           # Configuration with secure model management
│   │                                       # - MODELS_INTERNAL (server-only, actual IDs)
│   │                                       # - MODELS (client-safe, identifiers only)
│   │                                       # - Helper functions for ID resolution
│   ├── entry.client.jsx                    # Client-side entry point
│   ├── entry.server.jsx                    # Server-side entry point
│   ├── root.jsx                            # Root component
│   ├── routes/
│   │   ├── _index.jsx                      # Main UI component (homepage)
│   │   │                                   # - Uses model identifiers, not IDs
│   │   │                                   # - Credit cost display
│   │   │                                   # - Animation classes applied
│   │   ├── api.generate.jsx                # POST /api/generate endpoint
│   │   │                                   # - Validates and resolves identifiers
│   │   │                                   # - Returns credit cost
│   │   │                                   # - Never returns model IDs
│   │   ├── api.status.$generationId.jsx    # GET /api/status/:id endpoint
│   │   │                                   # - Strips modelId from response
│   │   ├── api.user.jsx                    # GET /api/user endpoint
│   │   └── api.generations.jsx             # GET /api/generations endpoint
│   │                                       # - Sanitizes all generation objects
│   └── styles/
│       └── app.css                         # Global styles and animations
│                                           # - Keyframes: slideIn, fadeIn, scaleIn
│                                           # - Credit badge styling
│                                           # - Light theme colors
├── package.json                            # Dependencies and scripts
├── vite.config.js                          # Vite build configuration
└── DOCUMENTATION.md                        # This file (comprehensive documentation)
```

---

## Setup and Installation

### Prerequisites
- Node.js >= 20.0.0
- Leonardo.ai API Key

### Installation Steps
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API credentials in `app/config.js`:
   ```javascript
   export const API_KEY = "your-api-key-here";
   export const USER_ID = "your-user-id-here";
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Start production server:
   ```bash
   npm start
   ```

---

## Development Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production bundle
- `npm start`: Start production server

---

## Error Handling

### Client-Side
- Form validation (required prompt, image count limits)
- Network error messages
- Generation failure notifications
- Loading states for all async operations

### Server-Side
- API request/response error handling
- Detailed error messages with status codes
- Logging for debugging
- Graceful fallbacks for missing data

---

## Security Considerations

### 1. Model ID Protection (Implemented)

**Problem**: Leonardo.ai model IDs are sensitive and should not be exposed to client-side code where they're visible in browser DevTools network tab.

**Solution**: Two-tier model storage system with identifier-based architecture.

#### Architecture Overview

**Client Side (Public)**:
- Uses safe model `identifier` slugs (e.g., "lightning-xl")
- MODELS array exported without actual Leonardo IDs
- All API requests send `modelIdentifier` only
- No sensitive IDs visible in network requests or browser console

**Server Side (Private)**:
- MODELS_INTERNAL array contains actual Leonardo model IDs
- Helper functions resolve identifiers to IDs internally
- Actual IDs used only for Leonardo API calls
- Never included in API responses to client

#### Data Flow

```
┌─────────────────┐                ┌─────────────────┐
│  Client/Browser │                │  Server (Remix) │
└────────┬────────┘                └────────┬────────┘
         │                                  │
         │  POST /api/generate              │
         │  { modelIdentifier:              │
         │    "lightning-xl" }              │
         ├─────────────────────────────────>│
         │                                  │
         │                         getModelIdByIdentifier()
         │                         resolves to actual ID:
         │                    "b24e16ff-06e3-43eb-8d33-..."
         │                                  │
         │                         Leonardo API call with
         │                         actual model ID
         │                                  │
         │  { success: true,                │
         │    generationId: "...",          │
         │<─────────────────────────────────┤
         │    creditcost: 8 }               │
         │  (no modelId returned)           │
         │                                  │
```

#### Implementation Details

**config.js - Dual Storage**:
```javascript
// Server-only with actual IDs (not exported)
const MODELS_INTERNAL = [
  {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",  // Sensitive!
    identifier: "lightning-xl",                   // Safe slug
    name: "Leonardo Lightning XL",
    // ...
  }
];

// Client-safe without IDs (exported)
export const MODELS = MODELS_INTERNAL.map(({ id, ...rest }) => rest);

// Server-side resolution function (not exported)
export function getModelIdByIdentifier(identifier) {
  const model = MODELS_INTERNAL.find(m => m.identifier === identifier);
  return model ? model.id : null;
}
```

**api.generate.jsx - Validation Layer**:
```javascript
const { modelIdentifier } = await request.json();

// Resolve identifier to actual ID server-side
const modelId = getModelIdByIdentifier(modelIdentifier);

if (!modelId) {
  return json({ error: "Invalid model identifier" }, { status: 400 });
}

// Use actual ID for Leonardo API call
const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
  body: JSON.stringify({ modelId, ...otherParams })
});

// Return response WITHOUT model ID
return json({ 
  success: true,
  generationId: data.sdGenerationJob.generationId,
  creditcost: extractedCost
  // No modelId!
});
```

**api.status.$generationId.jsx - Privacy Filter**:
```javascript
// Receive full data from Leonardo (contains modelId)
const generation = data.generations_by_pk;

// Return sanitized response
return json({
  success: true,
  status: generation.status,
  images: generatedImages,
  prompt: generation.prompt,
  createdAt: generation.createdAt 
  // modelId deliberately excluded
});
```

**api.generations.jsx - Bulk Sanitization**:
```javascript
const sanitizedGenerations = (data.generations || []).map(gen => {
  const { modelId, ...safeData } = gen;  // Strip modelId
  return safeData;
});

return json({
  success: true,
  generations: sanitizedGenerations  // No modelIds included
});
```

**_index.jsx - Client State**:
```javascript
const [selectedModelIdentifier, setSelectedModelIdentifier] = 
  useState(DEFAULT_MODEL_IDENTIFIER);  // "lightning-xl"

// Send identifier to API, not actual ID
const response = await fetch("/api/generate", {
  body: JSON.stringify({
    modelIdentifier: activeModel.identifier,  // Safe!
    // ...
  })
});
```

#### Security Benefits

✅ **No ID Exposure**: Actual Leonardo model IDs never leave the server  
✅ **Network Tab Safe**: Browser DevTools only show safe identifiers  
✅ **Console Safe**: No sensitive IDs in client-side JavaScript  
✅ **Validation**: Server validates all incoming identifiers  
✅ **Fail-Safe**: Invalid identifiers return 400 error, not internal data  
✅ **API Sanitization**: All API responses stripped of modelId field  
✅ **Separation of Concerns**: Clear boundary between public and private data  

### 2. API Key Protection

⚠️ **Important Security Notes**:
1. **API Key Exposure**: The API_KEY and USER_ID are currently hardcoded in config.js
   - **Recommendation**: Move to environment variables (.env file)
   - Use `.env` with `.gitignore` to prevent committing secrets
   
2. **Environment Variables Setup**:
   ```bash
   # .env file
   LEONARDO_API_KEY=your-api-key
   LEONARDO_USER_ID=your-user-id
   ```

3. **Update config.js** to use environment variables:
   ```javascript
   export const API_KEY = process.env.LEONARDO_API_KEY;
   export const USER_ID = process.env.LEONARDO_USER_ID;
   ```

### 3. Best Practices

- ✅ All sensitive IDs kept server-side only
- ✅ Client uses safe identifier slugs
- ✅ Server validates all incoming identifiers
- ✅ API responses sanitized before sending to client
- ⚠️ Move API credentials to environment variables
- ⚠️ Implement rate limiting for production
- ⚠️ Add request authentication for multi-user deployments

---

## Performance Optimizations

1. **Polling Strategy**: 2-second intervals with automatic cleanup
2. **Image Loading**: Lazy loading with responsive grid
3. **State Management**: React hooks with memoization
4. **CSS Animations**: Hardware-accelerated transforms
5. **API Calls**: Debounced and conditionally executed
6. **Build**: Vite for fast bundling and HMR

---

## Browser Compatibility

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Modern browsers with ES2020+ support

---

## Future Enhancements (Recommendations)

1. **Authentication**: User login/signup system
2. **Image History**: Persistent storage with database
3. **Image Editing**: Post-generation editing tools
4. **Favorites**: Save and organize favorite generations
5. **Sharing**: Social media sharing capabilities
6. **Search**: Search through generation history
7. **Filters**: Advanced filtering options
8. **Export**: Batch download multiple images
9. **Templates**: Save and reuse prompt templates
10. **Analytics**: Generation statistics and insights

---

## Support and Troubleshooting

### Common Issues

1. **Generation fails**:
   - Check API key validity
   - Verify model supports selected features (transparency, alchemy, etc.)
   - Check prompt length and content
   - Verify model identifier is valid

2. **Images not loading**:
   - Check network connectivity
   - Verify Leonardo API status
   - Check browser console for errors
   - Ensure generation status is COMPLETE

3. **Slow generation**:
   - Some models take longer than others
   - High resolution increases generation time
   - Multiple images increase processing time
   - PhotoReal mode is slower than standard generation

4. **Model selection issues**:
   - If auto-selection enabled, check feature compatibility
   - Verify USE_DYNAMIC_MODEL_SELECTION setting in config
   - Check that required features are supported by selected model

5. **Credit costs unexpected**:
   - Different models have different credit costs
   - High resolution and PhotoReal increase costs
   - Number of images multiplies the base cost

---

## API Rate Limits

Leonardo.ai API has rate limits (check their documentation):
- Implement rate limiting on client side
- Queue requests if necessary
- Display appropriate error messages

---

## License

Please check Leonardo.ai terms of service for API usage rights and restrictions.

---

## Contact & Support

For issues related to:
- **Leonardo.ai API**: Contact Leonardo.ai support
- **Application bugs**: Check application logs and error messages
- **Feature requests**: Document and prioritize based on user needs

---

**Last Updated**: February 17, 2026  
**Version**: 2.0.0 (Security Enhanced)  
**Framework**: Remix.run v2.15.0  
**API Version**: Leonardo.ai REST API v1

**Major Updates in v2.0.0**:
- 🔒 Secure model identifier system (IDs hidden from client)
- 💎 Credit cost tracking and display
- 🎨 Animation enhancements (slideIn, fadeIn, scaleIn)
- 🎭 Light theme with gradient accents
- 📊 Recent generations sidebar improvements
- 🛡️ Comprehensive API response sanitization
- ✅ Model support matrix updates (transparency, alchemy, etc.)
