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
  Frame,
} from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";

/**
 * Main App Component
 * Admin panel for configuring WhatsApp chat button
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

  // Position options for the button
  const positionOptions = [
    { label: "Bottom Right", value: "bottom-right" },
    { label: "Bottom Left", value: "bottom-left" },
    { label: "Top Right", value: "top-right" },
    { label: "Top Left", value: "top-left" },
  ];

  /**
   * Load settings from the backend on mount
   */
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

  /**
   * Save settings to the backend
   */
  const handleSave = async () => {
    setSaving(true);
    setBanner(null);

    // Validate phone number
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

  /**
   * Update a specific setting field
   */
  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Frame>
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
                    helpText="Include country code (e.g., +1 for US, +44 for UK)"
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
            <Card title="How to Enable" sectioned>
              <p style={{ marginBottom: "1rem" }}>
                After saving your settings:
              </p>
              <ol style={{ paddingLeft: "1.5rem" }}>
                <li style={{ marginBottom: "0.5rem" }}>
                  Go to your Shopify admin
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Navigate to Online Store → Themes
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Click "Customize" on your active theme
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  In the theme editor, click on "App embeds" in the left sidebar
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Enable "WhatsApp Chat Button"
                </li>
                <li>Save and publish your theme</li>
              </ol>
            </Card>

            <Card title="Preview" sectioned>
              <p style={{ marginBottom: "1rem" }}>
                Your button will appear at: <strong>{settings.position}</strong>
              </p>
              <p>
                Phone: <strong>{settings.phoneNumber || "Not set"}</strong>
              </p>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

/**
 * App initialization with Shopify App Bridge
 */
const config = {
  apiKey: window.shopifyApiKey || "",
  host: new URLSearchParams(window.location.search).get("host") || "",
};

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <React.StrictMode>
    <AppBridgeProvider config={config}>
      <AppProvider i18n={{}}>
        <App />
      </AppProvider>
    </AppBridgeProvider>
  </React.StrictMode>
);
