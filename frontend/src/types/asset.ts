export interface AppAsset {
  id: number;
  assetType: "Logo" | "Signature" | string;
  name: string;
  fileName: string;
  contentType: string;
  imageData: string;
  isDefault: boolean;
  uploadedBy: string;
  createdAt: string;
}
