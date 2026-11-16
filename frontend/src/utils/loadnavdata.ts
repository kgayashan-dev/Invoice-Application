// utils/loadnavdata.ts
// Finnect Digital Architecture: Dynamic navigation and access loader
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders, getStoredUser } from "@/utils/auth";

export interface SystemFunctionAccess {
  FunctionID: number;
  FunctionName: string;
  NavigationURL?: string;
  URL?: string;
  DisplayOrder?: number;
  SortOrder?: number;
  MenuID?: number;
  ModuleID?: number;
  ModuleName?: string;
  Module?: string;
  AccessID?: number;
}

export const fetchMenuData = async (
  menuId: string = "0"
): Promise<{ success: boolean; data?: SystemFunctionAccess[]; error?: string }> => {
  try {
    const apiUrl = getApiBaseUrl();
    const user = typeof window !== "undefined" ? getStoredUser() : null;
    const authHeaders = getAuthHeaders();

    const response = await fetch(`${apiUrl}/api/Auth/GetMenuID`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      cache: "no-store",
      body: JSON.stringify({
        menuId,
        loginID: user?.loginID || user?.userName || "",
      }),
      credentials: "include",
    });

    if (response.status === 401) {
      return { success: false, error: "Unauthorized" };
    }

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData?.message) errorMsg = errorData.message;
      } catch {
        if (text) errorMsg = text.slice(0, 200);
      }
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    const rawItems = Array.isArray(data) ? data : [];
    const items: SystemFunctionAccess[] = rawItems.map((item: any) => ({
      FunctionID: Number(item.FunctionID ?? item.functionID ?? item.AccessID ?? item.accessID ?? 0),
      FunctionName: String(item.FunctionName ?? item.functionName ?? ""),
      NavigationURL: String(item.NavigationURL ?? item.navigationURL ?? item.URL ?? item.url ?? ""),
      DisplayOrder: Number(item.DisplayOrder ?? item.displayOrder ?? 0),
      Module: String(item.Module ?? item.module ?? item.ModuleName ?? item.moduleName ?? "Administration"),
      ModuleName: String(item.ModuleName ?? item.moduleName ?? item.Module ?? item.module ?? "Administration"),
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("[loadnavdata] Error fetching menu data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading access permissions",
    };
  }
};

export const loadAccessData = () => fetchMenuData("0");
