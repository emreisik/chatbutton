import React from "react";
import ReactDOM from "react-dom/client";
import {
  AppProvider,
  Page,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Banner,
  Layout,
  SkeletonBodyText,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

/**
 * Main App Component - Standalone Admin Panel
 */
function App() {
  const [settings, setSettings] = React.useState({
    phoneNumber: "",
    defaultMessage: "Hi! I need help with...",
    position: "bottom-right",
    enabled: true,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [banner, setBanner] = React.useState(null);

  // Position options
  const positionOptions = [
    { label: "Bottom Right", value: "bottom-right" },
    { label: "Bottom Left", value: "bottom-left" },
    { label: "Top Right", value: "top-right" },
    { label: "Top Left", value: "top-left" },
  ];

  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      setBanner({
        status: "critical",
        title: "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setBanner(null);

    if (!settings.phoneNumber) {
      setBanner({
        status: "critical",
        title: "Please enter a WhatsApp phone number",
      });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setBanner({
          status: "success",
          title: "Settings saved successfully!",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setBanner({
        status: "critical",
        title: "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <AppProvider i18n={{}}>
      <Page
        title="WhatsApp Chat Button"
        subtitle="Configure your floating WhatsApp chat button"
        primaryAction={{
          content: "Save",
          loading: saving,
          onAction: handleSave,
        }}
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
                <SkeletonBodyText lines={8} />
              </Card>
            ) : (
              <Card sectioned>
                <FormLayout>
                  <TextField
                    label="WhatsApp Phone Number"
                    type="tel"
                    value={settings.phoneNumber}
                    onChange={(value) => updateSetting("phoneNumber", value)}
                    placeholder="+1234567890"
                    helpText="Include country code (e.g., +1 for US, +90 for Turkey)"
                    autoComplete="tel"
                  />

                  <TextField
                    label="Default Message"
                    value={settings.defaultMessage}
                    onChange={(value) => updateSetting("defaultMessage", value)}
                    placeholder="Hi! I need help with..."
                    helpText="Pre-filled message when customers click the button"
                    multiline={3}
                  />

                  <Select
                    label="Button Position"
                    options={positionOptions}
                    value={settings.position}
                    onChange={(value) => updateSetting("position", value)}
                    helpText="Choose where the button appears on your storefront"
                  />

                  <Checkbox
                    label="Enable WhatsApp chat button"
                    checked={settings.enabled}
                    onChange={(value) => updateSetting("enabled", value)}
                    helpText="Show or hide the button on your storefront"
                  />
                </FormLayout>
              </Card>
            )}
          </Layout.Section>

          <Layout.Section secondary>
            <Card title="Live Preview" sectioned>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ marginBottom: "1rem" }}>
                  This is how your button will look:
                </p>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "200px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px dashed #ccc",
                  }}
                >
                  {settings.enabled && settings.phoneNumber ? (
                    <a
                      href={`https://wa.me/${settings.phoneNumber.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(settings.defaultMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "60px",
                        height: "60px",
                        background: "#25D366",
                        borderRadius: "50%",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        textDecoration: "none",
                        transition: "transform 0.3s ease",
                        ...(settings.position === "bottom-right" && {
                          bottom: "20px",
                          right: "20px",
                        }),
                        ...(settings.position === "bottom-left" && {
                          bottom: "20px",
                          left: "20px",
                        }),
                        ...(settings.position === "top-right" && {
                          top: "20px",
                          right: "20px",
                        }),
                        ...(settings.position === "top-left" && {
                          top: "20px",
                          left: "20px",
                        }),
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="32"
                        height="32"
                        fill="white"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </a>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#999",
                      }}
                    >
                      Add phone number to see preview
                    </div>
                  )}
                </div>
                <div style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
                  <p>
                    Position: <strong>{settings.position}</strong>
                  </p>
                  <p>
                    Phone: <strong>{settings.phoneNumber || "Not set"}</strong>
                  </p>
                  <p>
                    Message: <strong>{settings.defaultMessage}</strong>
                  </p>
                </div>
              </div>
            </Card>

            <div style={{ marginTop: "1rem" }}>
              <Card title="Activate on Store" sectioned>
                <div style={{ marginBottom: "1rem" }}>
                  <p>To show this button on your store:</p>
                </div>
                <ol style={{ paddingLeft: "1.5rem" }}>
                  <li style={{ marginBottom: "0.5rem" }}>
                    Go to Shopify Admin
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    Online Store → Themes → Customize
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    App embeds → Enable "WhatsApp Chat Button"
                  </li>
                  <li>Save and Publish</li>
                </ol>
              </Card>
            </div>
          </Layout.Section>
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
