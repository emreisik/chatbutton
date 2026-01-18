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
  const [aiTemplates, setAiTemplates] = React.useState([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState("ecommerce_white");
  const [selectedModel, setSelectedModel] = React.useState("openai");
  const [selectedQuality, setSelectedQuality] = React.useState("standard");
  const [selectedSize, setSelectedSize] = React.useState("1024x1024");
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
    loadAITemplates();
  }, []);

  // Load AI templates
  const loadAITemplates = async () => {
    try {
      const response = await fetch("/api/ai/templates");
      const data = await response.json();
      setAiTemplates(data.templates || []);
      console.log("✅ AI Templates loaded:", data.templates);
    } catch (error) {
      console.error("❌ Failed to load AI templates:", error);
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

    const totalProducts = selectedProductDetails.length;
    const results = [];

    for (let i = 0; i < totalProducts; i++) {
      const product = selectedProductDetails[i];
      
      try {
        console.log(`🎨 Generating image ${i + 1}/${totalProducts} for: ${product.title}`);
        
        const response = await fetch("/api/products/generate-image", {
          method: "POST",
          headers: headers,
          credentials: "include",
          body: JSON.stringify({
            productId: product.id,
            productName: product.title,
            templateKey: selectedTemplate,
            modelType: selectedModel,
            quality: selectedQuality,
            size: selectedSize,
            uploadToShopify: uploadToShopify,
          }),
        });

        const data = await response.json();
        
        results.push({
          productId: product.id,
          productName: product.title,
          success: data.success,
          imageGenerated: data.imageGenerated || false,
          imageUrl: data.imageUrl || null,
          prompt: data.prompt,
          templateUsed: data.templateUsed,
          uploadedToShopify: data.shopifyImageId ? true : false,
        });

        setGenerationProgress(((i + 1) / totalProducts) * 100);
        setGenerationResults([...results]);

      } catch (error) {
        console.error(`❌ Error generating image for ${product.title}:`, error);
        results.push({
          productId: product.id,
          productName: product.title,
          success: false,
          error: error.message,
        });
      }
    }

    setGeneratingImages(false);
    
    const imagesGenerated = results.filter(r => r.imageGenerated).length;
    const uploadedToShopify = results.filter(r => r.uploadedToShopify).length;
    
    if (imagesGenerated > 0) {
      setBanner({
        status: "success",
        title: `${imagesGenerated} görsel oluşturuldu!`,
        content: uploadedToShopify > 0 
          ? `${uploadedToShopify} görsel Shopify'a yüklendi!` 
          : "Görseller oluşturuldu. Cloudinary yapılandırması ile otomatik yükleme yapabilirsiniz.",
      });
    } else {
      setBanner({
        status: "success",
        title: `${results.filter(r => r.success).length} ürün için AI prompt oluşturuldu!`,
        content: "Prompt'ları DALL-E 3, Midjourney veya Stable Diffusion ile kullanabilirsiniz.",
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

              {/* AI Model Seçimi */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                      AI Modeli
                    </Text>
                    <Select
                      label="Model"
                      options={[
                        { label: "🎨 OpenAI DALL-E 3 (Önerilen)", value: "openai" },
                        { label: "🤖 Google Gemini 2.0", value: "gemini" },
                      ]}
                      value={selectedModel}
                      onChange={setSelectedModel}
                    />
                  </BlockStack>
                </div>
              </Card>

              {/* Prompt Şablonu Seçimi */}
              <Card>
                <div style={{ padding: "1rem" }}>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                      Fotoğraf Stili
                    </Text>
                    <Select
                      label="Prompt Şablonu"
                      options={aiTemplates.map((t) => ({
                        label: t.name,
                        value: t.id,
                      }))}
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                    />
                  </BlockStack>
                </div>
              </Card>

              {/* DALL-E 3 Options */}
              {selectedModel === "openai" && (
                <Card>
                  <div style={{ padding: "1rem" }}>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm" fontWeight="semibold">
                        DALL-E 3 Ayarları
                      </Text>
                      <Select
                        label="Kalite"
                        options={[
                          { label: "Standard (Hızlı)", value: "standard" },
                          { label: "HD (Yüksek Kalite)", value: "hd" },
                        ]}
                        value={selectedQuality}
                        onChange={setSelectedQuality}
                      />
                      <Select
                        label="Boyut"
                        options={[
                          { label: "1024x1024 (Kare)", value: "1024x1024" },
                          { label: "1792x1024 (Yatay)", value: "1792x1024" },
                          { label: "1024x1792 (Dikey)", value: "1024x1792" },
                        ]}
                        value={selectedSize}
                        onChange={setSelectedSize}
                      />
                    </BlockStack>
                  </div>
                </Card>
              )}

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
                      {generationResults.map((result) => (
                        <div
                          key={result.productId}
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
                            
                            {/* Image Preview */}
                            {result.imageUrl && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <img 
                                  src={result.imageUrl} 
                                  alt={result.productName}
                                  style={{ 
                                    width: "100%", 
                                    maxWidth: "300px",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                  }}
                                />
                                {result.uploadedToShopify && (
                                  <Badge status="success" style={{ marginTop: "0.5rem" }}>
                                    Shopify'a Yüklendi
                                  </Badge>
                                )}
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
                            ✨ {selectedModel === "openai" ? "DALL-E 3" : "Gemini 2.0"} ile görsel üretimi başarılı! 
                            {uploadToShopify && " Görseller otomatik olarak Shopify'a yüklendi."}
                          </Text>
                        </Banner>
                      ) : (
                        <Banner status="info">
                          <Text as="p" variant="bodyS">
                            {selectedModel === "openai" 
                              ? "DALL-E 3 ile profesyonel ürün görselleri oluşturulacak."
                              : "Gemini 2.0 ile AI destekli görsel üretimi yapılacak."}
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
