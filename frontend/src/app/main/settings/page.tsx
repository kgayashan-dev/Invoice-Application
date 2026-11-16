"use client";

import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2 } from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import AppCard from "@/components/layout/AppCard";
import AppAlert from "@/components/feedback/AppAlert";
import FormField from "@/components/forms/FormField";
import TextInput from "@/components/forms/TextInput";
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";

interface SystemSettingItem {
  id: number;
  category: string;
  settingKey: string;
  settingValue: string;
  description?: string;
}

export default function SettingsPage() {
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
    <PageShell>
      <DarkPageHeader
        icon={<Settings className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Administration", "Settings"]}
        pageTitle="System Settings"
        description="Global environment variables, billing thresholds, and security parameters"
        onRefresh={fetchSettings}
        isRefreshing={loading}
      />

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
            subtitle={`Parameters governing ${cat.toLowerCase()} behavior`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {settings
                .filter((s) => s.category === cat)
                .map((s) => (
                  <FormField
                    key={s.id}
                    label={s.settingKey.replace(/([A-Z])/g, " $1").trim()}
                    hint={s.description}
                  >
                    <TextInput
                      value={s.settingValue}
                      onChange={(e) => handleChange(s.id, e.target.value)}
                    />
                  </FormField>
                ))}
            </div>
          </AppCard>
        ))}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </form>
    </PageShell>
  );
}
