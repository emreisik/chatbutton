import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as AppBridgeProvider, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";
import {
  AppProvider,
  Page,
  Card,
  DataTable,
  Button,
  Banner,
  Layout,
  SkeletonBodyText,
  Badge,
  EmptyState,
  Thumbnail,
  Text,
  BlockStack,
  InlineStack,
  Filters,
  ChoiceList,
  TextField,
  Select,
  Checkbox,
  Modal,
  List,
  ProgressBar,
  Icon,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import "@shopify/polaris/build/esm/styles.css";

/**
 * Get shop and host from URL parameters
 */
function getShopOrigin() {
  const params = new URLSearchParams(window.location.search);
  return {
    shop: params.get("shop") || "",
    host: params.get("host") || "",
  };
}

const { shop, host } = getShopOrigin();

/**
 * Shopify Ürün Listesi Uygulaması
 * Mağazadaki tüm ürünleri listeler
 */
function App() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState(null);
  
  // Filtreleme state'leri
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState([]);
  const [stockFilter, setStockFilter] = React.useState([]);
  const [vendorFilter, setVendorFilter] = React.useState([]);
  const [sortValue, setSortValue] = React.useState("name-asc");
  
  // Seçim state'leri
  const [selectedProducts, setSelectedProducts] = React.useState([]);
  
  // AI Modal state'leri
  const [aiModalActive, setAiModalActive] = React.useState(false);
  const [leonardoModels, setLeonardoModels] = React.useState([]); // Leonardo AI models
  const [selectedLeonardoModel, setSelectedLeonardoModel] = React.useState("nano-banana-pro"); // Leonardo model
  const [customPrompt, setCustomPrompt] = React.useState(
    `Image-to-image transformation. DUAL OBJECTIVES:

OBJECTIVE 1 - ABSOLUTE GARMENT LOCK (HIGHEST PRIORITY):
The clothing and all garment elements are COMPLETELY LOCKED and UNTOUCHABLE.
ZERO modifications allowed to ANY garment aspect:
- Colors, patterns, textures, fabrics (EXACT preservation)
- Buttons, zippers, logos, text, embellishments (EXACT preservation)
- Cuts, fits, shapes, draping, wrinkles, folds (EXACT preservation)
- Seams, stitches, fabric tension, transparency (EXACT preservation)
- Garment positioning and how clothes sit on body (EXACT preservation)

ALSO preserve EXACTLY:
- Body pose, stance, all hand/arm/leg positions
- Camera angle, framing, composition
- Lighting, shadows, highlights, studio setup
- Background, floor, props
- Image sharpness, quality

OBJECTIVE 2 - FACE REPLACEMENT (SECONDARY):
Replace the woman's face and hair with a CLEARLY DIFFERENT person.
New model should have noticeably different facial features.
Natural realistic appearance, professional fashion model look.`
  ); // DUAL-PRIORITY prompt (init_strength 0.24: garment lock + face change)
  const [customNegativePrompt, setCustomNegativePrompt] = React.useState(
    "ANY clothing modification, ANY garment change, ANY fabric alteration, ANY color shift, ANY pattern modification, ANY texture change, ANY cut change, ANY fit change, ANY shape change, modified buttons, modified zippers, modified text, modified logos, modified embellishments, ANY seam change, ANY stitch change, ANY transparency change, ANY opacity change, ANY wrinkle change, ANY fold change, ANY draping change, garment deformation, fabric distortion, clothing replacement, outfit substitution, ANY pose change, ANY stance change, ANY hand position change, ANY arm position change, ANY leg position change, ANY body shape change, ANY camera angle change, ANY framing change, ANY composition change, ANY lighting change, ANY shadow change, ANY background change, ANY prop change, beauty filter, smooth skin, artificial look, cartoon, illustration, 3d render, painting, drawing, deformed, distorted, blurry, low quality, unrealistic"
  ); // MAXIMUM RESTRICTIVE negative prompt
  const [generatingImages, setGeneratingImages] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generationResults, setGenerationResults] = React.useState([]);
  const [uploadToShopify, setUploadToShopify] = React.useState(true);
  
  // Get App Bridge instance (if embedded)
  let app = null;
  try {
    app = useAppBridge();
  } catch (e) {
    console.log("📱 Not in embedded context");
  }

  // Load products on mount
  React.useEffect(() => {
    loadProducts();
    loadLeonardoModels();
  }, []);

  // Load Leonardo AI Models
  const loadLeonardoModels = async () => {
    try {
      const response = await fetch("/api/ai/leonardo-models");
      const data = await response.json();
      setLeonardoModels(data.models || []);
      console.log("✅ Leonardo Models loaded:", data.models);
    } catch (error) {
      console.error("❌ Failed to load Leonardo models:", error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setBanner(null);
    
    try {
      // Get session token from App Bridge (if available)
      let token = null;
      if (app) {
        try {
          token = await getSessionToken(app);
          console.log("🔑 Session token obtained from App Bridge");
        } catch (error) {
          console.error("⚠️ Failed to get session token:", error);
        }
      }

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("📤 Sending request with Authorization header");
      } else {
        console.log("⚠️ No session token available, sending without auth");
      }

      // Fetch products
      const response = await fetch("/api/products", { 
        method: "GET",
        headers: headers,
        credentials: "include", // Include cookies
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        console.error("❌ 401 Unauthorized");
        setBanner({
          status: "critical",
          title: "Yetkilendirme hatası! Lütfen uygulamayı yeniden yükleyin.",
          content: "OAuth akışını tamamlamak için /api/auth?shop=... URL'ini ziyaret edin.",
        });
        return;
      }
      
      setProducts(data.products || []);
      
      const productCount = data.products?.length || 0;
      const vendors = [...new Set(data.products?.map(p => p.vendor) || [])].length;
      
      setBanner({
        status: "success",
        title: `${productCount} ürün ve ${vendors} satıcı başarıyla yüklendi!`,
      });
      
      console.log("✅ Ürünler yüklendi:", data);
    } catch (error) {
      console.error("❌ Ürünler yüklenemedi:", error);
      setBanner({
        status: "critical",
        title: "Ürünler yüklenemedi! Lütfen tekrar deneyin.",
        content: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    loadProducts();
  };

  // Filtreleme ve sıralama fonksiyonları
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Durum filtresi
    if (statusFilter.length > 0) {
      filtered = filtered.filter((product) =>
        statusFilter.includes(product.status)
      );
    }

    // Stok filtresi
    if (stockFilter.length > 0) {
      filtered = filtered.filter((product) => {
        const inStock = product.inventory > 0;
        if (stockFilter.includes("in_stock") && inStock) return true;
        if (stockFilter.includes("out_of_stock") && !inStock) return true;
        return false;
      });
    }

    // Satıcı filtresi
    if (vendorFilter.length > 0) {
      filtered = filtered.filter((product) =>
        vendorFilter.includes(product.vendor)
      );
    }

    // Sıralama
    const [sortKey, sortDirection] = sortValue.split("-");
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortKey === "name") {
        comparison = a.title.localeCompare(b.title, "tr");
      } else if (sortKey === "price") {
        comparison = parseFloat(a.price) - parseFloat(b.price);
      } else if (sortKey === "stock") {
        comparison = a.inventory - b.inventory;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  // Filtreleri temizle
  const handleClearAll = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setStockFilter([]);
    setVendorFilter([]);
  };

  // Checkbox fonksiyonları
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isAllSelected = filteredProducts.length > 0 && 
    selectedProducts.length === filteredProducts.length;
  
  const isSomeSelected = selectedProducts.length > 0 && 
    selectedProducts.length < filteredProducts.length;

  // Satıcı listesini oluştur
  const vendors = React.useMemo(() => {
    const uniqueVendors = [...new Set(products.map((p) => p.vendor))];
    return uniqueVendors.sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  // AI Image Generation
  const handleOpenAIModal = () => {
    if (selectedProducts.length === 0) {
      setBanner({
        status: "warning",
        title: "Lütfen önce ürün seçin!",
        content: "AI görsel oluşturmak için en az bir ürün seçmelisiniz.",
      });
      return;
    }
    setAiModalActive(true);
    setGenerationResults([]);
  };

  const handleGenerateImages = async () => {
    setGeneratingImages(true);
    setGenerationProgress(0);
    setGenerationResults([]);

    const selectedProductDetails = filteredProducts.filter((p) =>
      selectedProducts.includes(p.id)
    );

    let token = null;
    if (app) {
      try {
        token = await getSessionToken(app);
      } catch (error) {
        console.error("Failed to get token:", error);
      }
    }

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const results = [];
    let totalImagesProcessed = 0;
    let totalImagesToProcess = 0;

    // Step 1: Fetch product details to get ALL images
    console.log(`🔍 Fetching details for ${selectedProductDetails.length} products...`);
    const productsWithImages = [];
    
    for (const product of selectedProductDetails) {
      try {
        const detailResponse = await fetch(`/api/products/${product.id}`, {
          headers: headers,
          credentials: "include",
        });
        const productDetail = await detailResponse.json();
        
        if (productDetail.images && productDetail.images.length > 0) {
          productsWithImages.push({
            ...product,
            allImages: productDetail.images,
          });
          totalImagesToProcess += productDetail.images.length;
          console.log(`📸 ${product.title}: ${productDetail.images.length} görsel bulundu`);
        }
      } catch (error) {
        console.error(`❌ Error fetching product details for ${product.title}:`, error);
      }
    }

    console.log(`📊 Total images to process: ${totalImagesToProcess}`);

    // Step 2: Generate new images for ALL existing images
    for (const product of productsWithImages) {
      for (const image of product.allImages) {
        try {
          console.log(`🎨 [${totalImagesProcessed + 1}/${totalImagesToProcess}] ${product.title} - Image ${image.id}`);
          
          // Start async generation
          const startResponse = await fetch("/api/products/generate-image", {
            method: "POST",
            headers: headers,
            credentials: "include",
            body: JSON.stringify({
              productId: product.id,
              productName: product.title,
              currentImageUrl: image.url,
              imageId: image.id, // For unique job ID
              modelType: "leonardo",
              leonardoModel: selectedLeonardoModel,
              customPrompt: customPrompt, // Custom user prompt
              customNegativePrompt: customNegativePrompt, // Custom negative prompt
              uploadToShopify: uploadToShopify,
            }),
          });

          const startData = await startResponse.json();
          
          if (!startData.success || !startData.jobId) {
            throw new Error(startData.error || "Failed to start generation");
          }

          console.log(`⏳ Job started: ${startData.jobId}`);

          // Poll for completion
          let attempts = 0;
          const maxAttempts = 40; // 40 * 3s = 2 minutes max
          let jobComplete = false;
          let finalResult = null;

          while (!jobComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            
            const statusResponse = await fetch(`/api/generation-status/${startData.jobId}`, {
              headers: headers,
              credentials: "include",
            });

            const jobStatus = await statusResponse.json();
            
            console.log(`🔄 [${attempts + 1}/${maxAttempts}] Status: ${jobStatus.status}`);

            if (jobStatus.status === "complete") {
              jobComplete = true;
              finalResult = jobStatus;
              console.log(`✅ Generation complete! Image: ${jobStatus.imageUrl}`);
            } else if (jobStatus.status === "failed") {
              console.error(`❌ Generation failed:`, jobStatus);
              console.error(`❌ Error details:`, jobStatus.errorDetails);
              throw new Error(jobStatus.error || "Generation failed");
            }

            attempts++;
          }

          if (!jobComplete) {
            throw new Error("Generation timeout after 2 minutes");
          }

          results.push({
            productId: product.id,
            productName: product.title,
            imageId: image.id,
            originalImageUrl: image.url,
            success: true,
            imageGenerated: true,
            newImageUrl: finalResult.imageUrl,
            creditsUsed: finalResult.creditsUsed,
            modelName: finalResult.modelName,
            uploadedToShopify: !!finalResult.shopifyImageId,
          });

          totalImagesProcessed++;
          setGenerationProgress((totalImagesProcessed / totalImagesToProcess) * 100);
          setGenerationResults([...results]);

        } catch (error) {
          console.error(`❌ Error for ${product.title}:`, error);
          results.push({
            productId: product.id,
            productName: product.title,
            imageId: image.id,
            success: false,
            error: error.message,
          });
          totalImagesProcessed++;
        }
      }
    }

    setGeneratingImages(false);
    
    const imagesGenerated = results.filter(r => r.imageGenerated).length;
    const uploadedToShopify = results.filter(r => r.uploadedToShopify).length;
    
    if (imagesGenerated > 0) {
      setBanner({
        status: "success",
        title: `${imagesGenerated} görsel oluşturuldu! (${selectedProductDetails.length} ürün)`,
        content: uploadedToShopify > 0 
          ? `✅ ${uploadedToShopify} görsel Shopify'a yüklendi!` 
          : "✅ Görseller oluşturuldu.",
      });
      
      // Reload products to see new images
      await loadProducts();
    } else {
      setBanner({
        status: "warning",
        title: "Görsel oluşturulamadı",
        content: "Lütfen API anahtarlarınızı ve ayarlarınızı kontrol edin.",
      });
    }
  };

  const filters = [
    {
      key: "status",
      label: "Durum",
      filter: (
        <ChoiceList
          title="Ürün Durumu"
          titleHidden
          choices={[
            { label: "Aktif", value: "active" },
            { label: "Pasif", value: "draft" },
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "stock",
      label: "Stok",
      filter: (
        <ChoiceList
          title="Stok Durumu"
          titleHidden
          choices={[
            { label: "Stokta Var", value: "in_stock" },
            { label: "Stokta Yok", value: "out_of_stock" },
          ]}
          selected={stockFilter}
          onChange={setStockFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "vendor",
      label: "Satıcı",
      filter: (
        <ChoiceList
          title="Satıcı"
          titleHidden
          choices={vendors.map((vendor) => ({
            label: vendor,
            value: vendor,
          }))}
          selected={vendorFilter}
          onChange={setVendorFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: "status",
      label: `Durum: ${statusFilter.map(s => s === "active" ? "Aktif" : "Pasif").join(", ")}`,
      onRemove: () => setStatusFilter([]),
    });
  }
  
  if (stockFilter.length > 0) {
    appliedFilters.push({
      key: "stock",
      label: `Stok: ${stockFilter.map(s => s === "in_stock" ? "Var" : "Yok").join(", ")}`,
      onRemove: () => setStockFilter([]),
    });
  }

  if (vendorFilter.length > 0) {
    appliedFilters.push({
      key: "vendor",
      label: `Satıcı: ${vendorFilter.join(", ")}`,
      onRemove: () => setVendorFilter([]),
    });
  }

  // Tablo satırları oluştur
  const rows = filteredProducts.map((product) => [
    // Checkbox
    <Checkbox
      checked={selectedProducts.includes(product.id)}
      onChange={() => handleSelectProduct(product.id)}
    />,
    
    // Ürün adı ve resim
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {product.image ? (
        <Thumbnail source={product.image} alt={product.title} size="small" />
      ) : (
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "#e0e0e0",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          📦
        </div>
      )}
      <Text as="span" fontWeight="bold">{product.title}</Text>
    </div>,
    
    // Satıcı
    <Text as="span">{product.vendor}</Text>,
    
    // Fiyat
    <Text as="span" fontWeight="bold">${product.price}</Text>,
    
    // Stok durumu
    <Badge status={product.inventory > 0 ? "success" : "critical"}>
      {product.inventory > 0 ? `${product.inventory} stokta` : "Stokta yok"}
    </Badge>,
    
    // Durum
    product.status === "active" ? (
      <Badge status="success">Aktif</Badge>
    ) : (
      <Badge status="info">Taslak</Badge>
    ),
    
    // Eylemler
    <Button
      plain
      onClick={() => {
        window.open(
          `https://admin.shopify.com/store/web-health-developer/products/${product.id}`,
          "_blank"
        );
      }}
    >
      Görüntüle
    </Button>,
  ]);

  return (
    <Page
        title="Ürünlerim"
        subtitle={
          selectedProducts.length > 0
            ? `${selectedProducts.length} ürün seçildi • ${filteredProducts.length} / ${products.length} gösteriliyor`
            : `${filteredProducts.length} / ${products.length} ürün gösteriliyor`
        }
        primaryAction={{
          content: "Yenile",
          onAction: refreshProducts,
          loading: loading,
        }}
        secondaryActions={[
          {
            content: "Yeni Ürün Ekle",
            onAction: () => {
              window.open(
                "https://admin.shopify.com/store/web-health-developer/products/new",
                "_blank"
              );
            },
          },
          {
            content: "🎨 AI Fotoğraf Oluştur",
            onAction: handleOpenAIModal,
            disabled: selectedProducts.length === 0,
          },
        ]}
      >
        <Layout>
          {banner && (
            <Layout.Section>
              <Banner
                status={banner.status}
                title={banner.title}
                onDismiss={() => setBanner(null)}
              />
            </Layout.Section>
          )}

          <Layout.Section>
            {/* Arama ve Filtreler */}
            <Card>
              <div style={{ padding: "1rem" }}>
                <BlockStack gap="400">
                  {/* Arama ve Sıralama */}
                  <InlineStack gap="400" align="space-between" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        placeholder="Ürün ara..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        clearButton
                        onClearButtonClick={() => setSearchQuery("")}
                        autoComplete="off"
                      />
                    </div>
                    <div style={{ minWidth: "200px" }}>
                      <Select
                        label="Sırala"
                        labelInline
                        options={[
                          { label: "İsim (A-Z)", value: "name-asc" },
                          { label: "İsim (Z-A)", value: "name-desc" },
                          { label: "Fiyat (Düşük-Yüksek)", value: "price-asc" },
                          { label: "Fiyat (Yüksek-Düşük)", value: "price-desc" },
                          { label: "Stok (Az-Çok)", value: "stock-asc" },
                          { label: "Stok (Çok-Az)", value: "stock-desc" },
                        ]}
                        value={sortValue}
                        onChange={setSortValue}
                      />
                    </div>
                  </InlineStack>

                  {/* Filtreler */}
                  <Filters
                    queryValue={searchQuery}
                    queryPlaceholder="Ürün ara..."
                    filters={filters}
                    appliedFilters={appliedFilters}
                    onQueryChange={setSearchQuery}
                    onQueryClear={() => setSearchQuery("")}
                    onClearAll={handleClearAll}
                  />
                </BlockStack>
              </div>
            </Card>

            {loading ? (
              <Card>
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <BlockStack gap="400" align="center">
                    <SkeletonBodyText lines={10} />
                    <Text as="p" tone="subdued">
                      Tüm ürünler yükleniyor... Bu birkaç saniye sürebilir.
                    </Text>
                  </BlockStack>
                </div>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <EmptyState
                  heading={products.length === 0 ? "Henüz ürün yok" : "Filtreye uygun ürün bulunamadı"}
                  action={
                    products.length === 0
                      ? {
                          content: "Ürün Ekle",
                          onAction: () => {
                            window.open(
                              "https://admin.shopify.com/store/web-health-developer/products/new",
                              "_blank"
                            );
                          },
                        }
                      : {
                          content: "Filtreleri Temizle",
                          onAction: handleClearAll,
                        }
                  }
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    {products.length === 0
                      ? "İlk ürününüzü ekleyerek başlayın!"
                      : "Farklı filtreler deneyerek arama yapabilirsiniz."}
                  </p>
                </EmptyState>
              </Card>
            ) : (
              <BlockStack gap="400">
                {/* Toplu Seçim */}
                {filteredProducts.length > 0 && (
                  <Card>
                    <div style={{ padding: "1rem" }}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Checkbox
                          label={`Tümünü Seç (${filteredProducts.length})`}
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          onChange={handleSelectAll}
                        />
                        {selectedProducts.length > 0 && (
                          <InlineStack gap="200">
                            <Text as="span" tone="subdued">
                              {selectedProducts.length} ürün seçildi
                            </Text>
                            <Button size="slim" onClick={() => setSelectedProducts([])}>
                              Seçimi Temizle
                            </Button>
                          </InlineStack>
                        )}
                      </InlineStack>
                    </div>
                  </Card>
                )}
                
                {/* Ürün Tablosu */}
                <Card>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text", "text", "text"]}
                    headings={["", "Ürün", "Satıcı", "Fiyat", "Stok", "Durum", "İşlemler"]}
                    rows={rows}
                    verticalAlign="middle"
                  />
                </Card>
              </BlockStack>
            )}
          </Layout.Section>

          {/* İstatistikler */}
          {!loading && products.length > 0 && (
            <Layout.Section secondary>
              <Card>
                <div style={{ padding: "1rem" }}>
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Özet
                  </Text>
                </div>
                <div style={{ padding: "0 1rem 1rem 1rem" }}>
                  <BlockStack gap="400">
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Gösterilen:</Text>
                                  <Text as="span" fontWeight="bold">{filteredProducts.length}</Text>
                                </InlineStack>
                                
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Toplam Ürün:</Text>
                                  <Text as="span" fontWeight="bold">{products.length}</Text>
                                </InlineStack>
                                
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Aktif Ürünler:</Text>
                                  <Text as="span" fontWeight="bold">
                                    {filteredProducts.filter((p) => p.status === "active").length}
                                  </Text>
                                </InlineStack>
                                
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Stokta Var:</Text>
                                  <Text as="span" fontWeight="bold">
                                    {filteredProducts.filter((p) => p.inventory > 0).length}
                                  </Text>
                                </InlineStack>
                                
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Stokta Yok:</Text>
                                  <Text as="span" fontWeight="bold">
                                    {filteredProducts.filter((p) => p.inventory === 0).length}
                                  </Text>
                                </InlineStack>
                                
                                <InlineStack align="space-between">
                                  <Text as="span" tone="subdued">Satıcı Sayısı:</Text>
                                  <Text as="span" fontWeight="bold">
                                    {vendors.length}
                                  </Text>
                                </InlineStack>
                </BlockStack>
                </div>
              </Card>

              <div style={{ marginTop: "1rem" }}>
                <Card>
                  <div style={{ padding: "1rem" }}>
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Hızlı Bilgi
                    </Text>
                  </div>
                  <div style={{ padding: "0 1rem 1rem 1rem" }}>
                    <BlockStack gap="200">
                      <p style={{ fontSize: "0.9em", color: "#666" }}>
                        Bu uygulama mağazanızdaki ürünleri listeler.
                      </p>
                      <p style={{ fontSize: "0.9em", color: "#666" }}>
                        Ürünlerinizi yönetmek için Shopify Admin panelini kullanabilirsiniz.
                      </p>
                    </BlockStack>
                  </div>
                </Card>
              </div>
            </Layout.Section>
          )}
        </Layout>

        {/* AI Image Generation Modal */}
        <Modal
          open={aiModalActive}
          onClose={() => setAiModalActive(false)}
          title="🎨 AI ile Ürün Fotoğrafı Oluştur"
          primaryAction={{
            content: generatingImages ? "Oluşturuluyor..." : "Fotoğraf Oluştur",
            onAction: handleGenerateImages,
            loading: generatingImages,
            disabled: generatingImages,
          }}
          secondaryActions={[
            {
              content: "İptal",
              onAction: () => setAiModalActive(false),
              disabled: generatingImages,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* Seçili Ürünler */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                      Seçili Ürünler ({selectedProducts.length})
                    </Text>
                    <List>
                      {filteredProducts
                        .filter((p) => selectedProducts.includes(p.id))
                        .map((product) => (
                          <List.Item key={product.id}>{product.title}</List.Item>
                        ))}
                    </List>
                  </BlockStack>
                </div>
              </Card>

              {/* Leonardo AI Model Seçimi */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      🎨 Leonardo AI Model
                    </Text>
                    <Select
                      label="Model Seçimi"
                      options={leonardoModels.map((m) => ({
                        label: `${m.name} - ${m.baseCredits} credits${m.recommended ? ' ⭐' : ''}`,
                        value: m.id,
                      }))}
                      value={selectedLeonardoModel}
                      onChange={setSelectedLeonardoModel}
                      helpText={
                        leonardoModels.find(m => m.id === selectedLeonardoModel)?.description || 
                        "Model seçimi yapın"
                      }
                    />
                    {(() => {
                      const currentModel = leonardoModels.find(m => m.id === selectedLeonardoModel);
                      if (!currentModel) return null;
                      
                      const costPerImage = (currentModel.baseCredits * 0.002).toFixed(3);
                      const costFor100 = (currentModel.baseCredits * 0.002 * 100).toFixed(2);
                      const costFor1000 = (currentModel.baseCredits * 0.002 * 1000).toFixed(2);
                      
                      return (
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">
                            <strong>Özellikler:</strong> {currentModel.features.join(', ')}
                          </Text>
                          <Text as="p" variant="bodySm" tone="success">
                            💰 <strong>${costPerImage}/görsel</strong>
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            📊 100 görsel → ${costFor100} | 1000 görsel → ${costFor1000}
                          </Text>
                        </BlockStack>
                      );
                    })()}
                  </BlockStack>
                </div>
              </Card>

              {/* Custom Prompt */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        ✏️ Prompt (Görsel Tanımı)
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Leonardo AI'a görselin nasıl olması gerektiğini anlatın. Bu prompt mevcut görseli analiz ettikten sonra kullanılacaktır.
                      </Text>
                    </BlockStack>
                    <TextField
                      label="Prompt"
                      value={customPrompt}
                      onChange={setCustomPrompt}
                      multiline={6}
                      autoComplete="off"
                      helpText="Örnek: replace the woman with a different female model, keep the exact same outfit..."
                    />
                    <TextField
                      label="Negative Prompt (İstenmeyen Özellikler)"
                      value={customNegativePrompt}
                      onChange={setCustomNegativePrompt}
                      multiline={4}
                      autoComplete="off"
                      helpText="Görselde istemediğiniz özellikleri belirtin"
                    />
                  </BlockStack>
                </div>
              </Card>

              {/* Leonardo AI Info Card */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                      🎨 img2img Teknolojisi
                    </Text>
                    <Text as="p" tone="subdued">
                      Mevcut görseli <strong>GPT-4 Vision ile analiz edip</strong>, Leonardo AI ile sadece yüzü değiştirir.
                    </Text>
                    <Text as="p" tone="success">
                      ✅ Kıyafet, poz, ışık %100 korunur<br/>
                      ✅ 2:3 oran (1024x1536) - fashion için ideal<br/>
                      ✅ Ultra gerçekçi yüzler<br/>
                      ✅ ~40-60 saniye/görsel<br/>
                      ✅ Mevcut görsel <strong>zorunlu</strong>
                    </Text>
                  </BlockStack>
                </div>
              </Card>

              {/* Upload Option */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <Checkbox
                    label="Oluşturulan görselleri otomatik olarak Shopify'a yükle"
                    checked={uploadToShopify}
                    onChange={setUploadToShopify}
                  />
                </div>
              </Card>

              {/* Progress */}
              {generatingImages && (
                <Card>
                  <div style={{ padding: "1rem" }}>
                    <BlockStack gap="200">
                      <Text as="p">Fotoğraflar oluşturuluyor...</Text>
                      <ProgressBar progress={generationProgress} size="small" />
                    </BlockStack>
                  </div>
                </Card>
              )}

              {/* Results */}
              {generationResults.length > 0 && (
                <Card>
                  <div style={{ padding: "1rem" }}>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        Sonuçlar
                      </Text>
                      {generationResults.map((result, index) => (
                        <div
                          key={`${result.productId}-${result.imageId || index}`}
                          style={{
                            padding: "0.75rem",
                            background: result.success ? "#f1f8f4" : "#fef1f1",
                            borderRadius: "8px",
                          }}
                        >
                          <BlockStack gap="200">
                            <Text as="p" fontWeight="semibold">
                              {result.success ? "✅" : "❌"} {result.productName}
                            </Text>
                            
                            {/* Before/After Image Preview */}
                            {(result.originalImageUrl || result.newImageUrl) && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <InlineStack gap="300" wrap={false}>
                                  {result.originalImageUrl && (
                                    <div style={{ flex: 1 }}>
                                      <Text as="p" variant="bodySm" tone="subdued">Eski:</Text>
                                      <img 
                                        src={result.originalImageUrl} 
                                        alt="Eski"
                                        style={{ 
                                          width: "100%", 
                                          maxWidth: "200px",
                                          borderRadius: "8px",
                                          border: "1px solid #e0e0e0",
                                          marginTop: "4px",
                                        }}
                                      />
                                    </div>
                                  )}
                                  {result.newImageUrl && (
                                    <div style={{ flex: 1 }}>
                                      <Text as="p" variant="bodySm" tone="success">Yeni:</Text>
                                      <img 
                                        src={result.newImageUrl} 
                                        alt="Yeni"
                                        style={{ 
                                          width: "100%", 
                                          maxWidth: "200px",
                                          borderRadius: "8px",
                                          border: "2px solid #008060",
                                          marginTop: "4px",
                                        }}
                                      />
                                    </div>
                                  )}
                                </InlineStack>
                                
                                {/* Upload Status & Actions */}
                                <div style={{ marginTop: "0.75rem" }}>
                                  {result.uploadedToShopify ? (
                                    <Badge status="success">
                                      ✓ Shopify'a Yüklendi
                                    </Badge>
                                  ) : result.success && result.newImageUrl && (
                                    <InlineStack gap="200">
                                      <Badge status="warning">
                                        Shopify'a Yüklenmedi
                                      </Badge>
                                      <Button
                                        size="slim"
                                        onClick={async () => {
                                          try {
                                            const sessionToken = await getSessionToken(app);
                                            const response = await fetch("/api/products/upload-image", {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${sessionToken}`,
                                              },
                                              credentials: "include",
                                              body: JSON.stringify({
                                                productId: result.productId,
                                                imageUrl: result.newImageUrl,
                                                altText: result.productName,
                                              }),
                                            });
                                            
                                            if (response.ok) {
                                              setBanner({
                                                status: "success",
                                                title: "Başarılı!",
                                                content: `${result.productName} görseli Shopify'a yüklendi.`,
                                              });
                                              // Update result
                                              result.uploadedToShopify = true;
                                              setGenerationResults([...generationResults]);
                                              await loadProducts();
                                            } else {
                                              throw new Error("Upload failed");
                                            }
                                          } catch (error) {
                                            setBanner({
                                              status: "critical",
                                              title: "Yükleme Hatası",
                                              content: error.message,
                                            });
                                          }
                                        }}
                                      >
                                        Shopify'a Yükle
                                      </Button>
                                    </InlineStack>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {result.success && result.prompt && (
                              <details style={{ marginTop: "0.5rem" }}>
                                <summary style={{ cursor: "pointer", fontSize: "0.9em" }}>
                                  Prompt'u Göster
                                </summary>
                                <div style={{ 
                                  padding: "0.5rem", 
                                  background: "white", 
                                  borderRadius: "4px",
                                  fontSize: "0.85em",
                                  fontFamily: "monospace",
                                  marginTop: "0.5rem",
                                }}>
                                  {result.prompt}
                                </div>
                              </details>
                            )}
                            
                            {result.error && (
                              <Text as="p" tone="critical" variant="bodyS">
                                {result.error}
                              </Text>
                            )}
                          </BlockStack>
                        </div>
                      ))}
                      {generationResults.some(r => r.imageGenerated) ? (
                        <Banner status="success">
                          <Text as="p" variant="bodyS">
                            ✨ Leonardo AI ile görsel üretimi başarılı! 
                            {uploadToShopify && " Görseller otomatik olarak Shopify'a yüklendi."}
                            {generationResults[0]?.creditsUsed && (
                              <> 💰 {generationResults[0].creditsUsed} credits/görsel kullanıldı.</>
                            )}
                          </Text>
                        </Banner>
                      ) : (
                        <Banner status="info">
                          <Text as="p" variant="bodyS">
                            🎨 Leonardo AI ile profesyonel moda görselleri oluşturulacak. Mevcut görsel analiz edilip sadece yüz değiştirilecek.
                          </Text>
                        </Banner>
                      )}
                    </BlockStack>
                  </div>
                </Card>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      </Page>
  );
}

// App Bridge configuration
const appBridgeConfig = {
  apiKey: "d8437b8ce81f6502e6eb89d102ebbf7d",
  host: host || btoa(shop + "/admin"),
  forceRedirect: true,
};

// Render app with App Bridge
const root = ReactDOM.createRoot(document.getElementById("app"));

// If shop parameter exists, use App Bridge (embedded app)
if (shop) {
  root.render(
    <React.StrictMode>
      <AppBridgeProvider config={appBridgeConfig}>
        <AppProvider i18n={{}}>
          <App />
        </AppProvider>
      </AppBridgeProvider>
    </React.StrictMode>
  );
} else {
  // Standalone mode (for testing without Shopify admin)
  root.render(
    <React.StrictMode>
      <AppProvider i18n={{}}>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
}
