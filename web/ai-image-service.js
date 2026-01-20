import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";
import * as faceapi from "@vladmandic/face-api";
import { Canvas, Image, ImageData } from "canvas";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Setup for face-api (ES modules compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Monkey-patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

// Leonardo AI configuration
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1";

// Leonardo AI Models with their IDs and credit costs
export const LEONARDO_MODELS = {
  "nano-banana-pro": {
    id: "1e60896f-3c26-4296-8ecc-53e2afecc132",
    name: "Nano Banana Pro (Gemini 3 Pro)",
    description: "Consistency & Infographics - NEW model",
    baseCredits: 9, // PhotoReal + Alchemy + img2img
    features: ["Image Ref", "PhotoReal", "Alchemy"],
    recommended: true,
  },
  "gpt-image-1.5": {
    id: "aa77f04e-3eec-4034-9c07-d0f619684628",
    name: "GPT Image-1.5",
    description: "Superior editing control, image integrity and detail preservation",
    baseCredits: 9, // With Alchemy
    features: ["Image Ref", "Alchemy", "High quality"],
  },
  "seedream-4.5": {
    id: "7545e862-b5e5-434a-8c9e-2a38e436239a",
    name: "Seedream 4.5",
    description: "Best for posters, logos, and text-heavy designs",
    baseCredits: 9, // With Alchemy
    features: ["Image Ref", "Alchemy", "Text rendering"],
  },
  "seedream-4.0": {
    id: "436e5b85-8a25-4f88-a923-2dcb04039aef",
    name: "Seedream 4.0",
    description: "Ultra-high quality for consistent image generations and editing",
    baseCredits: 9, // With Alchemy
    features: ["Image Ref", "Alchemy", "Consistency"],
  },
  "nano-banana": {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
    name: "Nano Banana",
    description: "Smart, context-aware edits and consistent, high-quality visuals",
    baseCredits: 9, // With Alchemy
    features: ["Image Ref", "Alchemy", "Fast"],
  },
  "lucid-origin": {
    id: "1aa0f478-51be-4efd-94e8-76bfc8f533af",
    name: "Lucid Origin",
    description: "Excellent color adherence and text rendering for HD output",
    baseCredits: 9, // With Alchemy
    features: ["Style Ref", "Content Ref", "Alchemy", "HD"],
  },
  "lucid-realism": {
    id: "5c232a9e-9061-4777-980a-ddc8e65647c6",
    name: "Lucid Realism",
    description: "Best for pairing with video generation, creating cinematic shots",
    baseCredits: 9, // With Alchemy
    features: ["Style Ref", "Content Ref", "Alchemy", "Cinematic"],
  },
  "flux2-pro": {
    id: "ce5d3d5f-456f-43f0-b5b1-8a9c9c9c9c9c",
    name: "FLUX.2 Pro",
    description: "Advanced prompt adherence with high-fidelity results",
    baseCredits: 10, // Premium, no Alchemy needed
    features: ["Image Guidance", "Premium"],
  },
};

const DEFAULT_LEONARDO_MODEL = "nano-banana-pro";

// Cloudinary configuration (optional - for image hosting)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️ Cloudinary configured for image storage");
}

// MODEL_TYPES removed - users now provide custom prompts directly

/**
 * E-ticaret Prompt Şablonları
 */
export const PROMPT_TEMPLATES = {
  ecommerce_white: {
    name: "E-ticaret (Beyaz Arka Plan)",
    prompt: (productName) => 
      `Professional e-commerce product photography of ${productName}, clean white background, studio lighting, high resolution, centered composition, perfect for online store, photorealistic, 8K quality`,
  },
  female_model: {
    name: "Kadın Model ile Ürün",
    prompt: (productName, productAnalysis, modelType = "caucasian") => {
      const modelDesc = MODEL_TYPES[modelType]?.description || MODEL_TYPES.caucasian.description;
      
      if (!productAnalysis) {
        // Fallback for no existing image
        return `Professional fashion photography: ${modelDesc} wearing ${productName}. Natural skin texture, photorealistic, professional studio look, 8K resolution.`;
      }
      
      return `TASK: Replace the woman with a different female model - ${modelDesc}

CRITICAL INSTRUCTIONS:
✓ Keep the EXACT SAME outfit (all clothing items, colors, fit, style)
✓ Keep the EXACT SAME pose (body position, arms, hands, legs, stance)
✓ Keep the EXACT SAME body shape and proportions
✓ Keep the EXACT SAME studio lighting setup
✓ Keep the EXACT SAME background
✓ Keep the EXACT SAME camera framing and angle
✓ ONLY CHANGE: The woman's face and hair

NEW MODEL MUST HAVE:
- ${modelDesc}
- Realistic, natural skin texture
- Professional fashion model appearance
- Face resembling the original model's style and attractiveness
- Natural, confident expression
- Well-groomed, professional hair styling

REFERENCE IMAGE DETAILS TO PRESERVE EXACTLY:
${productAnalysis}

PHOTOGRAPHY SPECIFICATIONS:
- Maintain identical professional studio lighting
- Same depth of field and focus
- Same color grading and tone
- High-end fashion editorial quality
- Photorealistic, 8K resolution
- Natural, professional look

NEGATIVE PROMPT (AVOID THESE):
❌ Different clothes, altered outfit, changed colors
❌ Different pose, altered body position
❌ Different body shape or proportions
❌ Changed background or setting
❌ Different lighting or shadows
❌ Different camera angle or framing
❌ Distorted hands, extra limbs
❌ Unnatural skin texture
❌ Amateur or unprofessional look`;
    },
  },
  lifestyle: {
    name: "Lifestyle Çekim",
    prompt: (productName) =>
      `${productName} in a beautiful lifestyle setting, natural environment, warm lighting, cozy atmosphere, real-life usage scenario, inviting and aspirational, photorealistic, 8K quality`,
  },
  studio_premium: {
    name: "Premium Stüdyo",
    prompt: (productName) =>
      `Luxury studio photography of ${productName}, dramatic lighting, elegant composition, high-end fashion aesthetic, soft shadows, premium quality feel, photorealistic, professional advertising style, 8K`,
  },
  minimalist: {
    name: "Minimalist",
    prompt: (productName) =>
      `Minimalist product photography of ${productName}, simple composition, neutral tones, clean lines, modern aesthetic, soft natural light, elegant simplicity, photorealistic, 8K quality`,
  },
  luxury_fashion: {
    name: "Lüks Moda",
    prompt: (productName, productAnalysis, modelType = "caucasian") => {
      const modelDesc = MODEL_TYPES[modelType]?.description || MODEL_TYPES.caucasian.description;
      
      if (!productAnalysis) {
        // Fallback for no existing image
        return `High-end luxury fashion editorial: ${modelDesc} wearing ${productName}. Dramatic lighting, vogue magazine aesthetic, photorealistic, 8K resolution.`;
      }
      
      return `TASK: Replace the woman with a different luxury fashion model - ${modelDesc}

CRITICAL INSTRUCTIONS:
✓ Keep the EXACT SAME luxury outfit (all garments, accessories, colors, fit)
✓ Keep the EXACT SAME sophisticated pose and body language
✓ Keep the EXACT SAME body shape and proportions
✓ Keep the EXACT SAME dramatic studio lighting
✓ Keep the EXACT SAME glamorous background/setting
✓ Keep the EXACT SAME camera framing and composition
✓ ONLY CHANGE: The model's face and hair

NEW MODEL MUST HAVE:
- ${modelDesc}
- High-end fashion model features
- Realistic, flawless skin texture
- Sophisticated, editorial expression
- Professional makeup and hair styling
- Face resembling original model's elegance
- Confident, powerful presence

REFERENCE IMAGE DETAILS TO PRESERVE EXACTLY:
${productAnalysis}

PHOTOGRAPHY SPECIFICATIONS:
- Maintain identical dramatic lighting setup
- Same luxury editorial aesthetic
- Same color grading and mood
- Vogue magazine quality
- Photorealistic, ultra-premium, 8K resolution
- Professional fashion editorial look

NEGATIVE PROMPT (AVOID THESE):
❌ Different outfit, altered clothing, changed accessories
❌ Different pose, altered body position or stance
❌ Different body proportions
❌ Changed background, different setting
❌ Different lighting setup or shadows
❌ Different camera angle or composition
❌ Distorted features, extra limbs
❌ Unnatural or amateur appearance`;
    },
  },
};

/**
 * Shopify'a Görsel Yükle
 */
export async function uploadImageToShopify(shopifyClient, productId, imageUrl, altText) {
  try {
    console.log(`📤 Uploading image to product ${productId}`);

    const response = await shopifyClient.post({
      path: `products/${productId}/images`,
      data: {
        image: {
          src: imageUrl,
          alt: altText,
        },
      },
    });

    console.log(`✅ Image uploaded successfully`);
    return response.body.image;

  } catch (error) {
    console.error("❌ Image Upload Error:", error);
    throw error;
  }
}

/**
 * Base64 Image'i Cloudinary'ye Upload Et
 */
export async function uploadBase64ToCloudinary(base64Data, fileName = "ai-product") {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log("⚠️ Cloudinary not configured, skipping upload");
      return {
        success: false,
        message: "Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to environment variables.",
      };
    }

    console.log(`☁️ Uploading image to Cloudinary...`);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        folder: "shopify-products",
        public_id: `${fileName}-${Date.now()}`,
        resource_type: "image",
      }
    );

    console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };

  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Leonardo AI Image-to-Image Generation
 * Uses img2img for perfect outfit/pose preservation
 */
export async function generateWithLeonardo(imageUrl, productName, productAnalysis, options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo API key not configured. Add LEONARDO_API_KEY to environment variables.");
  }

  try {
    const {
      width = 848, // Leonardo UI tested dimensions (848 × 1264)
      height = 1264, // 2:3 aspect ratio for fashion photography
      strength = 0.15, // OPTIMAL FOR FACE-ONLY: 0.15 (garments locked, only face changes)
      leonardoModel = DEFAULT_LEONARDO_MODEL, // Model selection
      customPrompt = null, // User's custom prompt
      customNegativePrompt = null, // User's custom negative prompt
    } = options;

    const selectedModel = LEONARDO_MODELS[leonardoModel] || LEONARDO_MODELS[DEFAULT_LEONARDO_MODEL];
    const modelId = selectedModel.id;
    
    console.log(`🎨 Using Leonardo model: ${selectedModel.name} (${selectedModel.baseCredits} credits)`);

    // Build prompt - use custom if provided, otherwise use ULTRA-MINIMAL default
    // CRITICAL: For face-only changes, keep prompt minimal and let init_strength do the work
    let prompt;
    if (customPrompt) {
      // User provided custom prompt
      prompt = customPrompt;
      console.log(`✏️ Using custom prompt from user`);
    } else {
      // MINIMAL PROMPT: Let init_strength control preservation, only guide face change
      prompt = `Replace the woman's face with a different female model. Keep everything else identical: same outfit, same pose, same lighting, same background. Professional fashion photography, photorealistic.`;
      console.log(`✏️ Using minimal prompt for face-only change (init_strength controls garment preservation)`);
    }

    // Ensure prompt doesn't exceed Leonardo's 1500 character limit
    const LEONARDO_MAX_PROMPT = 1500;
    if (prompt.length > LEONARDO_MAX_PROMPT) {
      console.warn(`⚠️ Prompt too long (${prompt.length} chars), truncating to ${LEONARDO_MAX_PROMPT}`);
      prompt = prompt.substring(0, LEONARDO_MAX_PROMPT - 3) + '...';
    }

    // ULTRA-MINIMAL Negative Prompt - Let init_strength handle preservation
    const negativePrompt = customNegativePrompt || `different outfit, changed clothing, modified garments, different pose, different background, different lighting, beauty filter, smooth skin, cartoon, illustration, 3d render, painting, deformed, distorted, blurry, low quality, unrealistic`;

    console.log(`🚫 Negative prompt length: ${negativePrompt.length} chars`);

    console.log(`🎨 Generating with Leonardo AI (img2img)...`);
    console.log(`📝 Prompt length: ${prompt.length}/${LEONARDO_MAX_PROMPT} chars`);
    console.log(`📝 Prompt preview: ${prompt.substring(0, 150)}...`);
    console.log(`🚫 Negative prompt: ${negativePrompt.substring(0, 100)}...`);

    // Step 1: Upload init image
    console.log(`📤 Step 1/4: Uploading init image...`);
    const uploadResponse = await axios.post(
      `${LEONARDO_API_URL}/init-image`,
      { extension: "jpg" },
      {
        headers: {
          Authorization: `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let { fields, url: uploadUrl, id: imageId } = uploadResponse.data.uploadInitImage;

    // Parse fields if it's a JSON string
    if (typeof fields === 'string') {
      console.log(`🔄 Fields is a string, parsing JSON...`);
      try {
        fields = JSON.parse(fields);
      } catch (e) {
        console.error(`❌ Failed to parse fields JSON:`, e);
        throw new Error("Invalid fields format from Leonardo API");
      }
    }

    // Step 2: Upload image to presigned URL (S3)
    console.log(`📤 Step 2/4: Uploading image data to S3...`);
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    
    console.log(`📤 Upload URL: ${uploadUrl}`);
    console.log(`📦 Image size: ${imageResponse.data.byteLength} bytes`);
    console.log(`📋 S3 fields: ${fields ? Object.keys(fields).length : 0} fields`);
    console.log(`📋 Field names: ${fields ? Object.keys(fields).join(', ') : 'none'}`);
    
    // Create FormData with proper field ordering for S3
    const formData = new FormData();
    
    // Add all S3 fields FIRST (critical order for AWS S3!)
    if (fields && typeof fields === 'object') {
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
        const displayValue = typeof value === 'string' ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : value;
        console.log(`  ✓ ${key}: ${displayValue}`);
      }
    } else {
      console.error(`❌ Fields is not an object:`, typeof fields, fields);
      throw new Error("Invalid fields format");
    }
    
    // Add file LAST (must be after all metadata fields)
    const imageBuffer = Buffer.from(imageResponse.data);
    formData.append("file", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
      knownLength: imageBuffer.length,
    });
    
    console.log(`  ✓ file: image.jpg (${imageBuffer.length} bytes, image/jpeg)`);

    // Upload to S3 with proper headers
    try {
      const uploadResult = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      
      console.log(`✅ S3 upload successful! Status: ${uploadResult.status}`);
    } catch (uploadError) {
      console.error(`❌ S3 upload failed:`, uploadError.message);
      console.error(`❌ S3 response:`, uploadError.response?.data);
      throw uploadError;
    }

    console.log(`✅ Init image ID: ${imageId}`);

    // Step 3: Generate image with img2img
    console.log(`🎨 Step 3/4: Generating new image...`);
    console.log(`📝 Payload: modelId=${modelId}, width=${width}, height=${height}, strength=${strength}`);
    
    // Build request body - MAXIMUM PRESERVATION (Without ControlNet)
    // Leonardo API parameters optimized for ZERO garment changes
    // NOTE: ControlNet is not supported in public API, using init_strength + guidance instead
    const requestBody = {
      prompt: prompt,
      negative_prompt: negativePrompt,
      modelId: modelId,
      width: width,
      height: height,
      num_images: 1,
      init_image_id: imageId,
      
      // CRITICAL PRESERVATION PARAMETERS:
      // Lower init_strength = stronger preservation of original structure
      // For face-only changes: 0.15-0.18 range keeps garments 100% intact
      init_strength: 0.15, // ULTRA LOW: 0.15 = maximum garment/pose/background preservation, only face changes
      
      // Higher guidance_scale = stronger adherence to prompt (and negative prompt)
      guidance_scale: 7.5, // BALANCED: 7.5 = natural face change without over-processing
      
      // Fixed seed for consistency
      seed: 12345,
      
      // CRITICAL: alchemy and photoReal MUST be OFF to preserve garments perfectly!
      // Alchemy modifies clothing details, causing changes to fabric, wrinkles, colors
      alchemy: false,
      photoReal: false,
      promptMagic: false, // Disable prompt magic
      
      // Additional supported parameters:
      public: false, // Private generation
      num_inference_steps: 40, // More steps = better quality and preservation (default: 30-40)
    };

    console.log(`🔒 FACE-ONLY CHANGE MODE (Garment Preservation):`);
    console.log(`   - init_strength: 0.15 (ULTRA LOW - only face changes, garments locked)`);
    console.log(`   - guidance_scale: 7.5 (BALANCED - natural face replacement)`);
    console.log(`   - num_inference_steps: 40 (high quality)`);
    console.log(`   - alchemy: false, photoReal: false, promptMagic: false`);

    console.log(`📤 Sending request to Leonardo AI...`);
    
    const generationResponse = await axios.post(
      `${LEONARDO_API_URL}/generations`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generationId = generationResponse.data.sdGenerationJob.generationId;
    console.log(`🔄 Generation ID: ${generationId}`);

    // Step 4: Poll for completion
    console.log(`⏳ Step 4/4: Waiting for generation to complete...`);
    let completed = false;
    let attempts = 0;
    let imageResult = null;

    while (!completed && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await axios.get(
        `${LEONARDO_API_URL}/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${LEONARDO_API_KEY}`,
          },
        }
      );

      const generation = statusResponse.data.generations_by_pk;
      
      if (generation.status === "COMPLETE") {
        completed = true;
        imageResult = generation.generated_images[0].url;
        console.log(`✅ Generation complete!`);
      } else if (generation.status === "FAILED") {
        throw new Error("Leonardo generation failed");
      } else {
        console.log(`⏳ Status: ${generation.status} (attempt ${attempts + 1}/60)`);
      }
      
      attempts++;
    }

    if (!imageResult) {
      throw new Error("Leonardo generation timeout after 3 minutes");
    }

    console.log(`🖼️ Image URL: ${imageResult}`);

    return {
      success: true,
      imageGenerated: true,
      imageUrl: imageResult,
      model: `leonardo-${leonardoModel}`,
      modelName: selectedModel.name,
      creditsUsed: selectedModel.baseCredits,
      method: "img2img",
      prompt: prompt,
      strength: strength,
      dimensions: `${width}x${height}`,
    };

  } catch (error) {
    console.error("❌ Leonardo AI Error:", error.message);
    console.error("❌ Leonardo API Response:", error.response?.data);
    console.error("❌ Leonardo API Status:", error.response?.status);
    console.error("❌ Leonardo API URL:", error.config?.url);
    
    // Create a more detailed error message
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        "Leonardo AI request failed";
    
    const detailedError = new Error(errorMessage);
    detailedError.response = error.response;
    detailedError.originalError = error;
    
    throw detailedError;
  }
}

/**
 * ============================================================================
 * CANVAS INPAINTING - Face-only swap with mask (100% garment preservation)
 * ============================================================================
 */

// Face detection models initialization (lazy load)
let faceDetectionModelsLoaded = false;

async function loadFaceDetectionModels() {
  if (faceDetectionModelsLoaded) return;
  
  const modelsPath = join(__dirname, "models");
  console.log(`📦 Loading face detection models from: ${modelsPath}`);
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
  ]);
  
  faceDetectionModelsLoaded = true;
  console.log(`✅ Face detection models loaded`);
}

/**
 * Parse fields from Leonardo API (sometimes JSON string, sometimes object)
 */
function parseFields(fieldsStr) {
  if (!fieldsStr) return {};
  try {
    return typeof fieldsStr === "string" ? JSON.parse(fieldsStr) : fieldsStr;
  } catch {
    return {};
  }
}

/**
 * Upload image to presigned S3 URL (no Authorization header!)
 */
async function uploadToPresignedUrl({ url, fields, imageBuffer, mimeType, filename }) {
  const formData = new FormData();

  // Add all S3 fields FIRST (critical order for AWS S3!)
  if (fields && typeof fields === "object") {
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
  }

  // Add file LAST
  formData.append("file", imageBuffer, {
    filename: filename,
    contentType: mimeType,
    knownLength: imageBuffer.length,
  });

  // CRITICAL: Do NOT send Authorization header to presigned URL!
  const uploadResult = await axios.post(url, formData, {
    headers: {
      ...formData.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  // 204 is expected success for S3
  if (![200, 201, 204].includes(uploadResult.status)) {
    throw new Error(`S3 upload failed: HTTP ${uploadResult.status}`);
  }

  return uploadResult;
}

/**
 * Generate face mask for inpainting
 * White (255) = face area to change
 * Black (0) = everything else to preserve (garments, background, etc.)
 */
async function generateFaceMask(imageBuffer, options = {}) {
  const {
    includeFace = true,
    includeHair = false, // Set to true if you want hair to change too
    dilationPixels = 4, // Expand mask to avoid edge artifacts
    featherPixels = 10, // Blur mask edges for natural blending
  } = options;

  try {
    // Load face detection models
    await loadFaceDetectionModels();

    // Load image with sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Convert to canvas for face-api
    const imageData = await image.raw().toBuffer();
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(imageData);
    ctx.putImageData(imgData, 0, 0);

    // Detect faces
    console.log(`🔍 Detecting faces in ${width}x${height} image...`);
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detections || detections.length === 0) {
      throw new Error("No faces detected in image. Cannot create mask.");
    }

    console.log(`✅ Found ${detections.length} face(s)`);

    // Use the first (largest) face
    const detection = detections[0];
    const box = detection.detection.box;
    const landmarks = detection.landmarks;

    // Create mask (black background)
    const maskCanvas = new Canvas(width, height);
    const maskCtx = maskCanvas.getContext("2d");
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, width, height);

    // Draw white ellipse for face
    if (includeFace) {
      maskCtx.fillStyle = "white";
      maskCtx.beginPath();
      
      // Get face oval points from landmarks
      const jawOutline = landmarks.getJawOutline();
      const leftEyebrowTop = landmarks.getLeftEyeBrow()[2];
      const rightEyebrowTop = landmarks.getRightEyeBrow()[2];
      
      // Calculate face oval dimensions (with dilation)
      const faceWidth = box.width + dilationPixels * 2;
      const faceHeight = box.height + dilationPixels * 2;
      const faceCenterX = box.x + box.width / 2;
      const faceCenterY = box.y + box.height / 2;

      // Draw ellipse for face
      maskCtx.ellipse(
        faceCenterX,
        faceCenterY,
        faceWidth / 2,
        faceHeight / 2,
        0,
        0,
        Math.PI * 2
      );
      maskCtx.fill();

      console.log(`✅ Face mask created: ${faceWidth}x${faceHeight} at (${faceCenterX}, ${faceCenterY})`);
    }

    // Add hair area if requested
    if (includeHair) {
      // Extend mask upwards for hair (simple heuristic)
      const hairHeight = box.height * 0.6;
      maskCtx.fillStyle = "white";
      maskCtx.beginPath();
      maskCtx.ellipse(
        box.x + box.width / 2,
        box.y - hairHeight / 2,
        box.width / 2 + dilationPixels,
        hairHeight,
        0,
        0,
        Math.PI * 2
      );
      maskCtx.fill();
      console.log(`✅ Hair area added to mask`);
    }

    // Convert canvas to buffer
    let maskBuffer = maskCanvas.toBuffer("image/png");

    // Apply feathering (Gaussian blur) to mask edges
    if (featherPixels > 0) {
      maskBuffer = await sharp(maskBuffer)
        .blur(featherPixels / 2)
        .toBuffer();
      console.log(`✅ Mask feathered with ${featherPixels}px blur`);
    }

    return {
      success: true,
      maskBuffer,
      width,
      height,
      faceDetected: true,
      faceCount: detections.length,
    };

  } catch (error) {
    console.error("❌ Face mask generation error:", error);
    throw error;
  }
}

/**
 * Leonardo Canvas Inpainting - Face swap with mask
 * 100% garment preservation using white mask on face only
 */
async function generateWithCanvasInpainting(imageUrl, options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo API key not configured.");
  }

  try {
    const {
      leonardoModel = DEFAULT_LEONARDO_MODEL,
      customPrompt = null,
      customNegativePrompt = null,
      includeHair = false, // Change hair too?
      initStrength = 0.15, // Lower = more preservation (UI shows inverse)
      guidanceScale = 7.0,
    } = options;

    const selectedModel = LEONARDO_MODELS[leonardoModel] || LEONARDO_MODELS[DEFAULT_LEONARDO_MODEL];
    const modelId = selectedModel.id;

    console.log(`🎭 Canvas Inpainting with ${selectedModel.name}`);
    console.log(`🎨 init_strength: ${initStrength} (lower = more preservation)`);

    // Step 1: Download original image
    console.log(`📥 Step 1/6: Downloading init image...`);
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Step 2: Generate face mask
    console.log(`🎭 Step 2/6: Generating face mask (face-only, garments preserved)...`);
    const maskResult = await generateFaceMask(imageBuffer, {
      includeFace: true,
      includeHair: includeHair,
      dilationPixels: 4,
      featherPixels: 10,
    });

    const maskBuffer = maskResult.maskBuffer;
    console.log(`✅ Mask generated: ${maskResult.width}x${maskResult.height}, ${maskResult.faceCount} face(s)`);

    // Step 3: Request presigned URLs for init + mask upload
    console.log(`📤 Step 3/6: Requesting presigned URLs...`);
    const presignResponse = await axios.post(
      `${LEONARDO_API_URL}/canvas-init-image`,
      {
        initExtension: "jpg",
        maskExtension: "png",
      },
      {
        headers: {
          Authorization: `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadData = presignResponse.data.uploadCanvasInitImage;
    const {
      initUrl,
      initFields,
      initImageId,
      maskUrl,
      maskFields,
      maskImageId,
    } = {
      initUrl: uploadData.initUrl,
      initFields: parseFields(uploadData.initFields),
      initImageId: uploadData.initImageId,
      maskUrl: uploadData.maskUrl,
      maskFields: parseFields(uploadData.maskFields),
      maskImageId: uploadData.maskImageId,
    };

    console.log(`✅ Presigned URLs received`);
    console.log(`   Init ID: ${initImageId}`);
    console.log(`   Mask ID: ${maskImageId}`);

    // Step 4: Upload init image to S3
    console.log(`📤 Step 4/6: Uploading init image to S3...`);
    await uploadToPresignedUrl({
      url: initUrl,
      fields: initFields,
      imageBuffer: imageBuffer,
      mimeType: "image/jpeg",
      filename: "init.jpg",
    });
    console.log(`✅ Init image uploaded`);

    // Step 5: Upload mask image to S3
    console.log(`📤 Step 5/6: Uploading mask image to S3...`);
    await uploadToPresignedUrl({
      url: maskUrl,
      fields: maskFields,
      imageBuffer: maskBuffer,
      mimeType: "image/png",
      filename: "mask.png",
    });
    console.log(`✅ Mask image uploaded`);

    // Step 6: Create Canvas Inpainting generation
    console.log(`🎨 Step 6/6: Starting Canvas Inpainting generation...`);

    const prompt = customPrompt || 
      "realistic fashion model face, natural skin texture, professional studio photography, same pose, same lighting, keep clothing unchanged";

    const negativePrompt = customNegativePrompt ||
      "changed outfit, altered jacket, changed skirt, changed waistband text, changed logo, different pose, different body shape, artifacts, distorted hands, beauty filter";

    const requestBody = {
      prompt: prompt,
      negative_prompt: negativePrompt,
      canvasRequest: true,
      canvasRequestType: "INPAINT",
      modelId: modelId,
      canvasInitId: initImageId,
      canvasMaskId: maskImageId,
      num_images: 1,
      guidance_scale: guidanceScale,
      init_strength: initStrength, // KEY: Low value = high preservation
      public: false,
    };

    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`🚫 Negative: ${negativePrompt.substring(0, 100)}...`);

    const generationResponse = await axios.post(
      `${LEONARDO_API_URL}/generations`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generationId = 
      generationResponse.data?.sdGenerationJob?.generationId ||
      generationResponse.data?.generationId;

    if (!generationId) {
      throw new Error("No generation ID returned from Leonardo API");
    }

    console.log(`🔄 Generation ID: ${generationId}`);

    // Step 7: Poll for completion
    console.log(`⏳ Polling for completion...`);
    let completed = false;
    let attempts = 0;
    let imageResult = null;

    while (!completed && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await axios.get(
        `${LEONARDO_API_URL}/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${LEONARDO_API_KEY}`,
          },
        }
      );

      const generation = statusResponse.data.generations_by_pk;

      if (generation.status === "COMPLETE") {
        completed = true;
        imageResult = generation.generated_images[0].url;
        console.log(`✅ Canvas Inpainting complete!`);
      } else if (generation.status === "FAILED") {
        throw new Error("Leonardo Canvas Inpainting failed");
      } else {
        console.log(`⏳ Status: ${generation.status} (attempt ${attempts + 1}/60)`);
      }

      attempts++;
    }

    if (!imageResult) {
      throw new Error("Canvas Inpainting timeout after 3 minutes");
    }

    console.log(`🖼️ Result: ${imageResult}`);

    return {
      success: true,
      imageGenerated: true,
      imageUrl: imageResult,
      model: `leonardo-canvas-${leonardoModel}`,
      modelName: selectedModel.name,
      creditsUsed: selectedModel.baseCredits,
      method: "canvas-inpainting",
      prompt: prompt,
      initStrength: initStrength,
      faceDetected: true,
      maskGenerated: true,
    };

  } catch (error) {
    console.error("❌ Canvas Inpainting Error:", error.message);
    console.error("❌ Details:", error.response?.data);
    throw error;
  }
}

console.log("🎨 AI Image Service initialized");
console.log(`🎨 Leonardo AI: ${LEONARDO_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
console.log(`🎨 Available Leonardo Models: ${Object.keys(LEONARDO_MODELS).length} models`);
console.log(`🎭 Canvas Inpainting: ✅ Available (face-only swap, 100% garment preservation)`);
