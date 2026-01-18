import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from "form-data";

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
      strength = 0.22, // ULTRA-LOCK: 0.22 for ZERO garment edits (lower = maximum preservation)
      leonardoModel = DEFAULT_LEONARDO_MODEL, // Model selection
      customPrompt = null, // User's custom prompt
      customNegativePrompt = null, // User's custom negative prompt
    } = options;

    const selectedModel = LEONARDO_MODELS[leonardoModel] || LEONARDO_MODELS[DEFAULT_LEONARDO_MODEL];
    const modelId = selectedModel.id;
    
    console.log(`🎨 Using Leonardo model: ${selectedModel.name} (${selectedModel.baseCredits} credits)`);

    // Build prompt - use custom if provided, otherwise use ULTRA-MINIMAL "ZERO-EDIT" default
    // NOTE: Leonardo AI analyzes init image automatically via img2img
    // CRITICAL: init_strength 0.22 + alchemy OFF + minimal prompt = ZERO garment changes
    let prompt;
    if (customPrompt) {
      // User provided custom prompt
      prompt = customPrompt;
      console.log(`✏️ Using custom prompt from user`);
    } else {
      // ULTRA-MINIMAL "ZERO-EDIT" prompt (product-agnostic, works for ALL garments)
      prompt = `Image-to-image transformation. Reference mode: LOCKED.

CRITICAL INSTRUCTION - DO NOT modify:
- ANY clothing items (preserve EXACT colors, patterns, textures, cuts, fits)
- ANY garment details (buttons, zippers, logos, text, embellishments, seams, stitches)
- ANY fabric properties (transparency, opacity, wrinkles, folds, tension, draping)
- Body pose, stance, hands, arms, legs position
- Camera angle, framing, composition
- Lighting, shadows, highlights
- Background, floor, props
- Image quality, sharpness

ONLY modify: Replace woman's face and hair with a different female model.
Keep similar age, ethnicity, skin tone. Natural realistic features, no artificial enhancements.`;
      console.log(`✏️ Using default ULTRA-MINIMAL "ZERO-EDIT" prompt (init_strength 0.22, alchemy OFF)`);
    }

    // Ensure prompt doesn't exceed Leonardo's 1500 character limit
    const LEONARDO_MAX_PROMPT = 1500;
    if (prompt.length > LEONARDO_MAX_PROMPT) {
      console.warn(`⚠️ Prompt too long (${prompt.length} chars), truncating to ${LEONARDO_MAX_PROMPT}`);
      prompt = prompt.substring(0, LEONARDO_MAX_PROMPT - 3) + '...';
    }

    // ULTRA-AGGRESSIVE Negative Prompt - blocks ANY garment modifications
    const negativePrompt = customNegativePrompt || `any clothing change, any fabric change, any color change, any pattern change, any texture change, modified garment, altered outfit, different cut, different fit, changed buttons, changed zippers, changed text, changed logos, changed embellishments, modified seams, modified stitches, different transparency, different opacity, different wrinkles, different folds, different draping, different pose, different stance, changed hands, changed arms, changed legs, different camera angle, different framing, different composition, different lighting, different shadows, different background, different props, beauty filter, smooth skin, artificial look, cartoon, illustration, 3d render, deformed, distorted, blurry, low quality`;

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
    
    // Build request body - PRODUCTION-TUNED for absolute garment preservation
    // Only using officially supported Leonardo API parameters
    const requestBody = {
      prompt: prompt,
      negative_prompt: negativePrompt,
      modelId: modelId,
      width: width,
      height: height,
      num_images: 1,
      init_image_id: imageId,
      init_strength: strength, // 0.28 = maximum garment lock
      guidance_scale: 6.5, // Tuned for product-locked generation
      seed: 12345, // Fixed seed for consistency (optional override via options)
      
      // CRITICAL: alchemy and photoReal MUST be OFF to preserve garments!
      // Alchemy modifies clothing details, causing changes to fabric, wrinkles, colors
      alchemy: false,
      photoReal: false,
      promptMagic: false, // Also disable prompt magic
      
      // NOTE: promptEnhance, presetStyle, private are UI-only settings
      // They are not supported by Leonardo API and cause "Unexpected variable" errors
    };

    console.log(`🔒 GARMENT LOCK MODE: alchemy=false, photoReal=false, strength=0.28`);

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

console.log("🎨 AI Image Service initialized");
console.log(`🎨 Leonardo AI: ${LEONARDO_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
console.log(`🎨 Available Leonardo Models: ${Object.keys(LEONARDO_MODELS).length} models`);
