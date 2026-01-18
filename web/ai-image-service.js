import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAvwKgDX5Qv0Ah78Qi1xFu7NZtiHMXXyWo";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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
    prompt: (productName) =>
      `Beautiful young female model wearing or holding ${productName}, professional fashion photography, elegant pose, natural lighting, lifestyle setting, modern and trendy, photorealistic, magazine quality, 8K`,
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
    prompt: (productName) =>
      `High-end luxury fashion photography of ${productName}, sophisticated model, glamorous setting, dramatic lighting, editorial style, vogue magazine aesthetic, ultra-premium feel, photorealistic, 8K quality`,
  },
};

/**
 * Mevcut Ürün Görselini GPT-4 Vision ile Analiz Et
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
              text: `Analyze this product image in detail. Describe:
1. Product type (clothing, accessory, etc.)
2. Color(s) - be very specific
3. Style and design details
4. Material/texture appearance
5. Any patterns or decorations
6. Key features that make it unique

Product name for reference: ${productName}

Provide a detailed, objective description that can be used to recreate this product in a new photo setting.`,
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
      max_tokens: 500,
    });

    const analysis = response.choices[0].message.content;
    console.log(`✅ Product analyzed successfully!`);
    console.log(`📝 Analysis: ${analysis.substring(0, 200)}...`);

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

    const { quality = "standard", size = "1024x1024", currentImageUrl, productAnalysis } = options;

    let prompt;

    // If we have analysis from existing image, use it
    if (productAnalysis) {
      console.log(`🎨 Generating NEW image based on existing product analysis`);
      
      // Create template-specific prompt using the analysis
      const templateInstructions = {
        female_model: "Beautiful young female model wearing this product, professional fashion photography, elegant pose, natural lighting, lifestyle setting, modern and trendy",
        ecommerce_white: "Professional e-commerce product photography, clean white background, studio lighting, high resolution, centered composition",
        lifestyle: "Product in a beautiful lifestyle setting, natural environment, warm lighting, cozy atmosphere, real-life usage scenario",
        studio_premium: "Luxury studio photography, dramatic lighting, elegant composition, high-end fashion aesthetic, soft shadows",
        minimalist: "Minimalist product photography, simple composition, neutral tones, clean lines, modern aesthetic",
        luxury_fashion: "High-end luxury fashion photography, sophisticated model, glamorous setting, dramatic lighting, editorial style, vogue magazine aesthetic",
      };

      const styleInstruction = templateInstructions[templateKey] || templateInstructions.ecommerce_white;

      prompt = `Create a professional product photograph with the following specifications:

PRODUCT DETAILS (from existing image):
${productAnalysis}

PHOTOGRAPHY STYLE:
${styleInstruction}

Requirements:
- Maintain exact product appearance (colors, design, details)
- Professional photography quality
- Photorealistic, high resolution 8K
- Focus on showcasing the product beautifully
- ${templateKey === 'female_model' ? 'Include an attractive female model wearing/using the product' : 'Product-focused composition'}`;

    } else {
      // Fallback to simple text prompt
      prompt = template.prompt(productName);
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

console.log("🎨 AI Image Service initialized");
console.log(`🤖 Gemini API: ${GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`🎨 OpenAI API: ${OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
console.log(`📋 Available templates: ${Object.keys(PROMPT_TEMPLATES).join(", ")}`);
