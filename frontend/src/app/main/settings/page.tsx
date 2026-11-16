"use client";

import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, Image as ImageIcon, PenTool, Sliders } from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import AppCard from "@/components/layout/AppCard";
import AppAlert from "@/components/feedback/AppAlert";
import FormField from "@/components/forms/FormField";
import TextInput from "@/components/forms/TextInput";
import AuthGuardAccess from "@/components/AuthGuardAccess";
import { useCurrency } from "@/Contexts/CurrencyContext";
import { SUPPORTED_CURRENCIES } from "@/utils/currency";
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";
import AssetManager from "@/components/settings/AssetManager";

interface SystemSettingItem {
  id: number;
  category: string;
  settingKey: string;
  settingValue: string;
  description?: string;
}

export default function SettingsPage() {
  const { setCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<"system" | "logos" | "signatures">("system");
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/SystemSettings`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (id: number, val: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, settingValue: val } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/SystemSettings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(
          settings.map((s) => ({ id: s.id, settingValue: s.settingValue }))
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update settings.");

      setMessage({ text: "System settings saved successfully.", type: "success" });
      const curr = settings.find((s) => s.settingKey.toLowerCase() === "defaultcurrency");
      if (curr) {
        setCurrency(curr.settingValue);
      }
      window.dispatchEvent(new CustomEvent("systemSettingsUpdated"));
      await fetchSettings();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error saving settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(new Set(settings.map((s) => s.category)));

  return (
    <AuthGuardAccess requiredPermission={3001}>
      <PageShell>
        <DarkPageHeader
          icon={<Settings className="w-4 h-4 text-cyan-400" />}
          breadcrumbs={["Home", "Administration", "Settings"]}
          pageTitle="System Settings & Assets"
          description="Manage global parameters, currencies, banking information, and printable PDF assets"
          onRefresh={fetchSettings}
          isRefreshing={loading}
        />

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeTab === "system"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            System Parameters & Banking
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logos")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeTab === "logos"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Company Logos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("signatures")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeTab === "signatures"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Authorized Signatures
          </button>
        </div>

        {activeTab === "system" && (
          <div className="space-y-3">
            {message && (
              <AppAlert
                variant={message.type === "success" ? "success" : "error"}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </AppAlert>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              {categories.map((cat) => (
                <AppCard
                  key={cat}
                  title={`${cat} Configuration`}
                  subtitle={`Parameters governing ${cat.toLowerCase()} settings and invoice outputs`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {settings
                      .filter((s) => s.category === cat)
                      .map((s) => (
                        <FormField
                          key={s.id}
                          label={s.settingKey.replace(/([A-Z])/g, " $1").trim()}
                          hint={s.description}
                        >
                          {s.settingKey.toLowerCase() === "defaultcurrency" ? (
                            <select
                              value={s.settingValue.toUpperCase()}
                              onChange={(e) => handleChange(s.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <TextInput
                              value={s.settingValue}
                              onChange={(e) => handleChange(s.id, e.target.value)}
                            />
                          )}
                        </FormField>
                      ))}
                  </div>
                </AppCard>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Configuration"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "logos" && (
          <AssetManager
            assetType="Logo"
            title="Company Logo"
            description="Upload official company logo graphics. The default logo will be placed in the header of invoice PDFs."
          />
        )}

        {activeTab === "signatures" && (
          <AssetManager
            assetType="Signature"
            title="Authorized Signature"
            description="Upload official signature PNG images with transparent backgrounds. Signatories can select their signature when generating or certifying invoice PDFs."
          />
        )}
      </PageShell>
    </AuthGuardAccess>
  );
}
