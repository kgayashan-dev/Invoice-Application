"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, CheckCircle, Image as ImageIcon, Star, AlertCircle } from "lucide-react";
import AppCard from "@/components/layout/AppCard";
import AppAlert from "@/components/feedback/AppAlert";
import { AppAsset } from "@/types/asset";
import { getAssets, uploadAsset, deleteAsset, setDefaultAsset } from "@/services/api";

interface AssetManagerProps {
  assetType: "Logo" | "Signature";
  title: string;
  description: string;
}

export default function AssetManager({ assetType, title, description }: AssetManagerProps) {
  const [assets, setAssets] = useState<AppAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states for new upload
  const [name, setName] = useState("");
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ fileName: string; contentType: string } | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssets(assetType);
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(`Error loading ${assetType}s:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [assetType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please select a valid image file (PNG, JPG, SVG, WebP).", type: "error" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: "Image file size must be less than 2MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setPreviewData(base64);
      setFileDetails({
        fileName: file.name,
        contentType: file.type || "image/png",
      });
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData || !fileDetails) {
      setMessage({ text: "Please select an image to upload.", type: "error" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      await uploadAsset({
        assetType,
        name: name.trim() || `${assetType} ${assets.length + 1}`,
        fileName: fileDetails.fileName,
        contentType: fileDetails.contentType,
        imageData: previewData,
        isDefault: isDefault || assets.length === 0,
      });

      setMessage({ text: `${title} uploaded successfully!`, type: "success" });
      setPreviewData(null);
      setFileDetails(null);
      setName("");
      setIsDefault(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAssets();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : `Failed to upload ${assetType}.`,
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${assetType.toLowerCase()}?`)) return;
    try {
      await deleteAsset(id);
      setMessage({ text: `${assetType} deleted successfully.`, type: "success" });
      await fetchAssets();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : `Failed to delete ${assetType}.`,
        type: "error",
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAsset(id, assetType);
      setMessage({ text: `Set as default ${assetType.toLowerCase()}!`, type: "success" });
      await fetchAssets();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : `Failed to set default.`,
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <AppAlert
          variant={message.type}
          title={message.type === "success" ? "Success" : "Error"}
          message={message.text}
          onDismiss={() => setMessage(null)}
        />
      )}

      {/* Upload Form Card */}
      <AppCard title={`Upload New ${title}`} subtitle={description}>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Asset Name / Label
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. Primary ${assetType} 2026`}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Choose Image File (PNG, JPG, SVG)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-blue-400 hover:file:bg-blue-100"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`isDefault-${assetType}`}
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`isDefault-${assetType}`} className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Set as default {assetType.toLowerCase()} for new invoices
                </label>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 min-h-[140px]">
              {previewData ? (
                <div className="text-center space-y-2">
                  <div className="max-h-24 max-w-full flex items-center justify-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewData} alt="Preview" className="max-h-20 object-contain" />
                  </div>
                  <span className="text-xs text-slate-500">{fileDetails?.fileName}</span>
                </div>
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">Select an image to preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!previewData || uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : `Upload ${assetType}`}
            </button>
          </div>
        </form>
      </AppCard>

      {/* Available Assets Gallery */}
      <AppCard title={`Available ${title}s (${assets.length})`} subtitle={`Select default or remove ${assetType.toLowerCase()} assets.`}>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading {assetType.toLowerCase()}s...</div>
        ) : assets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No {assetType.toLowerCase()}s uploaded yet. Use the form above to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  asset.isDefault
                    ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                {/* Default badge */}
                {asset.isDefault && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                    DEFAULT
                  </span>
                )}

                {/* Image Container */}
                <div className="h-24 w-full flex items-center justify-center p-2 mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.imageData} alt={asset.name} className="max-h-20 max-w-full object-contain" />
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={asset.name}>
                    {asset.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{asset.fileName}</p>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {!asset.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(asset.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      Active Default
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </div>
  );
}
