import { clearStoredUser, getAuthHeaders } from "@/utils/auth";

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname) {
      return `${protocol}//${hostname}:5038`;
    }
  }

  let envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl.includes("0.0.0.0")) {
    envUrl = envUrl.replace("0.0.0.0", "localhost");
  }
  return envUrl || "http://localhost:5038";
};

export type LoginResult = {
  success: boolean;
  error?: string;
  data?: {
    message?: string;
    user?: LoginUser[];
  };
};

export type LoginUser = {
  loginID?: string;
  LoginID?: string;
  UserName?: string;
  userName?: string;
  FullName?: string;
  fullName?: string;
  DisplayName?: string;
  displayName?: string;
  Email?: string;
  email?: string;
  RoleName?: string;
  roleName?: string;
  IsLockedOut?: boolean;
  isLockedOut?: boolean;
  IsLockedPermanently?: boolean;
  isLockedPermanently?: boolean;
  LoginMessage?: string;
  loginMessage?: string;
};

export async function login(username: string, password: string): Promise<LoginResult> {
  const apiUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiUrl}/api/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Login request failed:", error);
    if (error instanceof TypeError) {
      return {
        success: false,
        error: `Cannot connect to server at ${apiUrl}. Please check if the backend API is running.`,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

export async function logout(): Promise<boolean> {
  const apiUrl = getApiBaseUrl();
  try {
    await fetch(`${apiUrl}/api/Auth/logout`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      credentials: "include",
    });
  } catch {
    // Ignore fetch failures on offline
  } finally {
    clearStoredUser();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  return true;
}

export async function checkAuthentication(): Promise<boolean> {
  const apiUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiUrl}/api/Auth/isAuthenticated`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      credentials: "include",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
