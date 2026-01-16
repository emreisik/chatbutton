import React from "react";
import ReactDOM from "react-dom/client";
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
  Stack,
  Text,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

/**
 * Shopify Ürün Listesi Uygulaması
 * Mağazadaki tüm ürünleri listeler
 */
function App() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState(null);

  // Ürünleri yükle
  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setBanner(null);
    
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      
      setProducts(data.products || []);
      
      setBanner({
        status: "success",
        title: `${data.products?.length || 0} ürün başarıyla yüklendi!`,
      });
      
      console.log("✅ Ürünler yüklendi:", data.products);
    } catch (error) {
      console.error("❌ Ürünler yüklenemedi:", error);
      setBanner({
        status: "critical",
        title: "Ürünler yüklenemedi! Lütfen tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    loadProducts();
  };

  // Tablo satırları oluştur
  const rows = products.map((product) => [
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
    <Stack spacing="tight">
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
      </Button>
    </Stack>,
  ]);

  return (
    <AppProvider i18n={{}}>
      <Page
        title="Ürünlerim"
        subtitle={`Toplam ${products.length} ürün`}
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
            {loading ? (
              <Card>
                <Card.Section>
                  <SkeletonBodyText lines={10} />
                </Card.Section>
              </Card>
            ) : products.length === 0 ? (
              <Card>
                <EmptyState
                  heading="Henüz ürün yok"
                  action={{
                    content: "Ürün Ekle",
                    onAction: () => {
                      window.open(
                        "https://admin.shopify.com/store/web-health-developer/products/new",
                        "_blank"
                      );
                    },
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>İlk ürününüzü ekleyerek başlayın!</p>
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
              <Card title="Özet" sectioned>
                <Stack vertical spacing="loose">
                  <Stack distribution="equalSpacing">
                    <Text as="span" color="subdued">Toplam Ürün:</Text>
                    <Text as="span" fontWeight="bold">{products.length}</Text>
                  </Stack>
                  
                  <Stack distribution="equalSpacing">
                    <Text as="span" color="subdued">Aktif Ürünler:</Text>
                    <Text as="span" fontWeight="bold">
                      {products.filter((p) => p.status === "active").length}
                    </Text>
                  </Stack>
                  
                  <Stack distribution="equalSpacing">
                    <Text as="span" color="subdued">Stokta Var:</Text>
                    <Text as="span" fontWeight="bold">
                      {products.filter((p) => p.inventory > 0).length}
                    </Text>
                  </Stack>
                  
                  <Stack distribution="equalSpacing">
                    <Text as="span" color="subdued">Stokta Yok:</Text>
                    <Text as="span" fontWeight="bold">
                      {products.filter((p) => p.inventory === 0).length}
                    </Text>
                  </Stack>
                </Stack>
              </Card>

              <div style={{ marginTop: "1rem" }}>
                <Card title="Hızlı Bilgi" sectioned>
                  <Stack vertical spacing="tight">
                    <p style={{ fontSize: "0.9em", color: "#666" }}>
                      Bu uygulama mağazanızdaki ürünleri listeler.
                    </p>
                    <p style={{ fontSize: "0.9em", color: "#666" }}>
                      Ürünlerinizi yönetmek için Shopify Admin panelini kullanabilirsiniz.
                    </p>
                  </Stack>
                </Card>
              </div>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </AppProvider>
  );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
