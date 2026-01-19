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
    baseCredits: 9,
    features: ["Image Ref", "PhotoReal", "Alchemy"],
    recommended: true,
  },
  "gpt-image-1.5": {
    id: "aa77f04e-3eec-4034-9c07-d0f619684628",
    name: "GPT Image-1.5",
    description: "Superior editing control, image integrity and detail preservation",
    baseCredits: 9,
    features: ["Image Ref", "Alchemy", "High quality"],
  },
  "seedream-4.5": {
    id: "7545e862-b5e5-434a-8c9e-2a38e436239a",
    name: "Seedream 4.5",
    description: "Best for posters, logos, and text-heavy designs",
    baseCredits: 9,
    features: ["Image Ref", "Alchemy", "Text rendering"],
  },
  "seedream-4.0": {
    id: "436e5b85-8a25-4f88-a923-2dcb04039aef",
    name: "Seedream 4.0",
    description: "Ultra-high quality for consistent image generations and editing",
    baseCredits: 9,
    features: ["Image Ref", "Alchemy", "Consistency"],
  },
  "nano-banana": {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
    name: "Nano Banana",
    description: "Smart, context-aware edits and consistent, high-quality visuals",
    baseCredits: 9,
    features: ["Image Ref", "Alchemy", "Fast"],
  },
  "lucid-origin": {
    id: "1aa0f478-51be-4efd-94e8-76bfc8f533af",
    name: "Lucid Origin",
    description: "Excellent color adherence and text rendering for HD output",
    baseCredits: 9,
    features: ["Style Ref", "Content Ref", "Alchemy", "HD"],
  },
  "lucid-realism": {
    id: "5c232a9e-9061-4777-980a-ddc8e65647c6",
    name: "Lucid Realism",
    description: "Best for pairing with video generation, creating cinematic shots",
    baseCredits: 9,
    features: ["Style Ref", "Content Ref", "Alchemy", "Cinematic"],
  },
  "flux2-pro": {
    id: "ce5d3d5f-456f-43f0-b5b1-8a9c9c9c9c9c",
    name: "FLUX.2 Pro",
    description: "Advanced prompt adherence with high-fidelity results",
    baseCredits: 10,
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
 * Uses img2img for face-only changes with garment preservation
 */
export async function generateWithLeonardo(imageUrl, productName, productAnalysis, options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo API key not configured. Add LEONARDO_API_KEY to environment variables.");
  }

  try {
    const {
      width = 848,
      height = 1264,
      strength = 0.15,
      leonardoModel = DEFAULT_LEONARDO_MODEL,
      customPrompt = null,
      customNegativePrompt = null,
    } = options;

    const selectedModel = LEONARDO_MODELS[leonardoModel] || LEONARDO_MODELS[DEFAULT_LEONARDO_MODEL];
    const modelId = selectedModel.id;
    
    console.log(`🎨 Using Leonardo model: ${selectedModel.name} (${selectedModel.baseCredits} credits)`);

    let prompt;
    if (customPrompt) {
      prompt = customPrompt;
      console.log(`✏️ Using custom prompt from user`);
    } else {
      prompt = `Professional fashion model wearing the exact same outfit. Same pose, same studio lighting, same background. High-end fashion photography, 8K, photorealistic.`;
      console.log(`✏️ Using clean default prompt`);
    }

    const LEONARDO_MAX_PROMPT = 1500;
    if (prompt.length > LEONARDO_MAX_PROMPT) {
      console.warn(`⚠️ Prompt too long (${prompt.length} chars), truncating to ${LEONARDO_MAX_PROMPT}`);
      prompt = prompt.substring(0, LEONARDO_MAX_PROMPT - 3) + '...';
    }

    const negativePrompt = customNegativePrompt || `ugly, deformed, noisy, blurry, low quality, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers, amateur, low-res`;

    console.log(`🎨 Generating with Leonardo AI (img2img)...`);
    console.log(`📝 Prompt length: ${prompt.length}/${LEONARDO_MAX_PROMPT} chars`);

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

    if (typeof fields === 'string') {
      console.log(`🔄 Fields is a string, parsing JSON...`);
      try {
        fields = JSON.parse(fields);
      } catch (e) {
        console.error(`❌ Failed to parse fields JSON:`, e);
        throw new Error("Invalid fields format from Leonardo API");
      }
    }

    // Step 2: Upload image to presigned URL
    console.log(`📤 Step 2/4: Uploading image data to S3...`);
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    
    const formData = new FormData();
    
    if (fields && typeof fields === 'object') {
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
      }
    }
    
    const imageBuffer = Buffer.from(imageResponse.data);
    formData.append("file", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
      knownLength: imageBuffer.length,
    });

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
      throw uploadError;
    }

    console.log(`✅ Init image ID: ${imageId}`);

    // Step 3: Generate image
    console.log(`🎨 Step 3/4: Generating new image...`);
    
    const requestBody = {
      prompt: prompt,
      negative_prompt: negativePrompt,
      modelId: modelId,
      width: width,
      height: height,
      num_images: 1,
      init_image_id: imageId,
      init_strength: strength, // DYNAMIC: lower = preserve more of original
      guidance_scale: 10,
      alchemy: true,
      photoReal: true,
      photoRealVersion: "v2",
      promptMagic: true,
      promptMagicVersion: "v3",
      num_inference_steps: 50,
      public: false,
    };

    console.log(`🔒 HIGH-QUALITY MODE (PhotoReal v2 + Alchemy):`);
    console.log(`   - init_strength: ${strength} (Lower = preserve original more)`);
    console.log(`   - guidance_scale: 10 (Strong prompt adherence)`);
    console.log(`   - photoReal: v2, alchemy: true, promptMagic: v3`);
    const generationResponse = await axios.post(
      `${LEONARDO_API_URL}/generations`,
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
 * Canvas Inpainting - TEMPORARILY DISABLED
 * Requires native dependencies (canvas, sharp, face-api) which cause issues in Railway
 * TODO: Re-enable once Railway build is fixed with proper native dependencies
 */
export async function generateWithCanvasInpainting(imageUrl, options = {}) {
  throw new Error("Canvas Inpainting is temporarily disabled. Native dependencies (canvas, face-api) need Railway build configuration. Please use img2img method instead.");
}

console.log("🎨 AI Image Service initialized");
console.log(`🎨 Leonardo AI: ${LEONARDO_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
console.log(`🎨 Available Leonardo Models: ${Object.keys(LEONARDO_MODELS).length} models`);
console.log(`⚠️  Canvas Inpainting: Temporarily disabled (native dependencies issue)`);
