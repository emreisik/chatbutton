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
} from "@shopify/polaris";
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
  const [sortValue, setSortValue] = React.useState("name-asc");
  
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
  }, []);

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
      
      setBanner({
        status: "success",
        title: `${data.products?.length || 0} ürün başarıyla yüklendi!`,
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

  // Tablo satırları oluştur
  const rows = filteredProducts.map((product) => [
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
        subtitle={`${filteredProducts.length} / ${products.length} ürün gösteriliyor`}
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
                <div style={{ padding: "1rem" }}>
                  <SkeletonBodyText lines={10} />
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
              <Card>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Ürün", "Fiyat", "Stok", "Durum", "İşlemler"]}
                  rows={rows}
                  verticalAlign="middle"
                />
              </Card>
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
