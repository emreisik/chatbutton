import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from "form-data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAvwKgDX5Qv0Ah78Qi1xFu7NZtiHMXXyWo";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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
    baseCredits: 8,
    features: ["Image Ref", "High quality"],
  },
  "seedream-4.5": {
    id: "7545e862-b5e5-434a-8c9e-2a38e436239a",
    name: "Seedream 4.5",
    description: "Best for posters, logos, and text-heavy designs",
    baseCredits: 7,
    features: ["Image Ref", "Text rendering"],
  },
  "seedream-4.0": {
    id: "436e5b85-8a25-4f88-a923-2dcb04039aef",
    name: "Seedream 4.0",
    description: "Ultra-high quality for consistent image generations and editing",
    baseCredits: 7,
    features: ["Image Ref", "Consistency"],
  },
  "nano-banana": {
    id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
    name: "Nano Banana",
    description: "Smart, context-aware edits and consistent, high-quality visuals",
    baseCredits: 6,
    features: ["Image Ref", "Fast"],
  },
  "lucid-origin": {
    id: "1aa0f478-51be-4efd-94e8-76bfc8f533af",
    name: "Lucid Origin",
    description: "Excellent color adherence and text rendering for HD output",
    baseCredits: 5,
    features: ["Style Ref", "Content Ref", "HD"],
  },
  "lucid-realism": {
    id: "5c232a9e-9061-4777-980a-ddc8e65647c6",
    name: "Lucid Realism",
    description: "Best for pairing with video generation, creating cinematic shots",
    baseCredits: 5,
    features: ["Style Ref", "Content Ref", "Cinematic"],
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
 * Model Tipleri (Tutarlılık için)
 */
export const MODEL_TYPES = {
  caucasian: {
    name: "Beyaz Ten - Avrupa",
    description: "25 year old Caucasian female model with fair skin, light brown wavy hair, hazel eyes, defined cheekbones, natural makeup, elegant and sophisticated look, professional model appearance",
  },
  asian: {
    name: "Asya",
    description: "25 year old East Asian female model with smooth porcelain skin, straight black hair, almond-shaped dark eyes, delicate features, natural makeup, graceful and elegant appearance, professional model",
  },
  african: {
    name: "Afrika",
    description: "25 year old African female model with beautiful dark skin, natural curly black hair, expressive dark eyes, high cheekbones, radiant smile, confident pose, professional model appearance",
  },
  latin: {
    name: "Latin",
    description: "25 year old Latina female model with warm olive skin, long dark brown hair, deep brown eyes, striking features, natural makeup, vibrant and confident look, professional model",
  },
  middle_eastern: {
    name: "Orta Doğu",
    description: "25 year old Middle Eastern female model with olive skin, long dark hair, deep brown eyes, elegant features, subtle makeup, sophisticated and graceful appearance, professional model",
  },
  mixed: {
    name: "Karma",
    description: "25 year old mixed-race female model with warm beige skin, wavy brown hair, expressive eyes, unique features, natural makeup, modern and versatile look, professional model appearance",
  },
};

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
 * Mevcut Ürün Görselini GPT-4 Vision ile Analiz Et
 * (Kıyafet, poz, arka plan, ışıklandırma detaylarıyla)
 */
export async function analyzeProductImage(imageUrl, productName) {
  if (!openai) {
    throw new Error("OpenAI API key not configured.");
  }

  try {
    console.log(`🔍 Analyzing existing product image with GPT-4 Vision...`);
    console.log(`📷 Image URL: ${imageUrl}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this fashion/product photo in EXTREME detail. This analysis will be used to recreate the EXACT same photo with only the model's face changed.

Describe with precision:

1. OUTFIT DETAILS:
   - Exact clothing items worn (type, fit, style)
   - Colors (be very specific - shades, tones)
   - Fabric/material appearance and texture
   - Any patterns, prints, or decorations
   - How the clothing fits and drapes on the body
   - All accessories (jewelry, bags, shoes, etc.)

2. MODEL POSE & BODY:
   - Exact body position and stance
   - Arm positions, hand placement
   - Leg position, feet placement
   - Body angles and orientation
   - Gaze direction and head tilt
   - Overall body posture and weight distribution

3. STUDIO SETUP:
   - Background type and color
   - Lighting setup (direction, quality, shadows)
   - Camera angle and framing
   - Distance from camera (full body, 3/4, etc.)
   - Any props or set elements

4. OVERALL ATMOSPHERE:
   - Professional fashion shoot style
   - Mood and vibe of the image
   - Technical quality (sharp focus, depth of field)

Product name: ${productName}

BE EXTREMELY SPECIFIC - this description must allow perfect recreation of everything EXCEPT the model's face and hair.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    });

    const analysis = response.choices[0].message.content;
    console.log(`✅ Product analyzed successfully!`);
    console.log(`📝 Analysis: ${analysis.substring(0, 300)}...`);

    return analysis;

  } catch (error) {
    console.error("❌ GPT-4 Vision Analysis Error:", error);
    throw error;
  }
}

/**
 * OpenAI DALL-E 3 ile Görsel Üret (Mevcut Görselden)
 */
export async function generateWithDALLE3(productName, templateKey = "ecommerce_white", options = {}) {
  if (!openai) {
    throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to environment variables.");
  }

  try {
    const template = PROMPT_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const { 
      quality = "standard", 
      size = "1024x1024", 
      currentImageUrl, 
      productAnalysis,
      modelType = "caucasian" // Default model type
    } = options;

    let prompt;

    // Use template's prompt function with product analysis and model type
    if (typeof template.prompt === 'function') {
      prompt = template.prompt(productName, productAnalysis, modelType);
    } else {
      // Fallback to simple text prompt
      prompt = template.prompt;
    }

    console.log(`🎨 Generating image with DALL-E 3 for: ${productName}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 200)}...`);

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    console.log(`✅ Image generated successfully with DALL-E 3!`);
    console.log(`🔗 New Image URL: ${imageUrl}`);

    return {
      success: true,
      imageGenerated: true,
      imageUrl: imageUrl,
      prompt: revisedPrompt || prompt,
      originalPrompt: prompt,
      templateUsed: template.name,
      model: "dall-e-3",
      quality: quality,
      size: size,
      usedExistingImage: !!productAnalysis,
    };

  } catch (error) {
    console.error("❌ DALL-E 3 Generation Error:", error);
    throw error;
  }
}

/**
 * Gemini 2.0 ile Görsel Üret (Imagen 3)
 */
export async function generateProductImage(productName, templateKey = "ecommerce_white", modelType = "openai", options = {}) {
  // Use OpenAI DALL-E 3 if specified and configured
  if (modelType === "openai" && openai) {
    // If we have an existing image URL, analyze it first
    if (options.currentImageUrl) {
      try {
        console.log(`📸 Analyzing existing product image before generation...`);
        const productAnalysis = await analyzeProductImage(options.currentImageUrl, productName);
        options.productAnalysis = productAnalysis;
      } catch (error) {
        console.error("⚠️ Failed to analyze existing image, continuing with text-only prompt:", error.message);
      }
    }
    
    return await generateWithDALLE3(productName, templateKey, options);
  }

  // Use Gemini if OpenAI not available or specified
  try {
    const template = PROMPT_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const prompt = template.prompt(productName);
    console.log(`🎨 Generating image with Gemini for: ${productName}`);
    console.log(`📝 Prompt: ${prompt}`);

    // Try Gemini 2.0 Flash (with image generation)
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        },
      });

      console.log(`🚀 Using Gemini 2.0 Flash for image generation...`);
      
      const result = await model.generateContent([
        {
          text: `Generate a high-quality product image based on this description:\n\n${prompt}\n\nCreate a professional, photorealistic image suitable for e-commerce.`,
        },
      ]);

      const response = result.response;
      
      // Check if image was generated
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        // Look for image data in the response
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
              console.log(`✅ Image generated successfully!`);
              
              return {
                success: true,
                imageData: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
                prompt: prompt,
                templateUsed: template.name,
                model: "gemini-2.0-flash-exp",
              };
            }
          }
        }
      }

      // If no image in response, fall back to prompt enhancement
      console.log(`⚠️ No image generated, falling back to prompt optimization...`);
      
    } catch (imageError) {
      console.log(`⚠️ Image generation failed, using prompt optimization fallback:`, imageError.message);
    }

    // Fallback: Optimize prompt with Gemini Pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const enhancedPromptResult = await model.generateContent([
      `You are a professional product photographer. Enhance this product photography prompt to make it more detailed and effective for AI image generation. Return ONLY the enhanced prompt, nothing else:\n\n${prompt}`,
    ]);

    const enhancedPrompt = enhancedPromptResult.response.text().trim();
    console.log(`✨ Enhanced Prompt: ${enhancedPrompt}`);

    return {
      success: true,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      templateUsed: template.name,
      message: "Prompt optimized successfully. Use this with DALL-E 3, Midjourney or Stable Diffusion.",
      model: "gemini-pro",
    };

  } catch (error) {
    console.error("❌ AI Image Generation Error:", error);
    throw error;
  }
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
export async function generateWithLeonardo(imageUrl, productName, productAnalysis, modelType = "caucasian", options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo API key not configured. Add LEONARDO_API_KEY to environment variables.");
  }

  try {
    const {
      width = 1024,
      height = 1536, // 2:3 aspect ratio for fashion photography
      strength = 0.5, // How much to change from original (0.3-0.7 recommended)
      leonardoModel = DEFAULT_LEONARDO_MODEL, // Model selection
    } = options;

    const selectedModel = LEONARDO_MODELS[leonardoModel] || LEONARDO_MODELS[DEFAULT_LEONARDO_MODEL];
    const modelId = selectedModel.id;
    
    console.log(`🎨 Using Leonardo model: ${selectedModel.name} (${selectedModel.baseCredits} credits)`);


    const modelDesc = MODEL_TYPES[modelType]?.description || MODEL_TYPES.caucasian.description;

    // Build prompt
    const prompt = `Replace the woman with a different female model - ${modelDesc}. Keep the exact same outfit, same pose, same body, same studio lighting, same background, same framing. Only change the face and hair of the woman. Realistic fashion model, natural skin texture, professional studio look. Ultra detailed, photorealistic, 8K quality.

${productAnalysis ? `\nREFERENCE TO PRESERVE:\n${productAnalysis}` : ''}`;

    const negativePrompt = `different clothes, altered outfit, changed colors, different pose, different body shape, distorted hands, extra limbs, background change, lighting change, blurry, low quality, amateur, cartoon, illustration`;

    console.log(`🎨 Generating with Leonardo AI (img2img)...`);
    console.log(`📝 Prompt preview: ${prompt.substring(0, 150)}...`);

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

    const { fields, url: uploadUrl, id: imageId } = uploadResponse.data.uploadInitImage;

    // Step 2: Upload image to presigned URL
    console.log(`📤 Step 2/4: Uploading image data...`);
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", Buffer.from(imageResponse.data), { filename: "image.jpg" });

    await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders(),
    });

    console.log(`✅ Image uploaded, ID: ${imageId}`);

    // Step 3: Generate image with img2img
    console.log(`🎨 Step 3/4: Generating new image...`);
    const generationResponse = await axios.post(
      `${LEONARDO_API_URL}/generations`,
      {
        prompt: prompt,
        negative_prompt: negativePrompt,
        modelId: modelId, // Selected Leonardo model
        width: width,
        height: height,
        num_images: 1,
        init_image_id: imageId,
        init_strength: strength,
        guidance_scale: 7,
        photoReal: selectedModel.features.includes("PhotoReal"), // PhotoReal if supported
        photoRealVersion: "v2",
        presetStyle: "FASHION", // Fashion photography preset
      },
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
    console.error("❌ Leonardo AI Error:", error.response?.data || error.message);
    throw error;
  }
}

console.log("🎨 AI Image Service initialized");
console.log(`🤖 Gemini API: ${GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`🎨 OpenAI API: ${OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`🎨 Leonardo API: ${LEONARDO_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`📋 Available templates: ${Object.keys(PROMPT_TEMPLATES).join(", ")}`);
