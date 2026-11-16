import { clearStoredUser } from "@/utils/auth";

export const getApiBaseUrl = (): string => {
  let envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl.includes("0.0.0.0")) {
    envUrl = envUrl.replace("0.0.0.0", "localhost");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0") {
      return `http://${host}:5038`;
    }
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
  UserName?: string;
  FullName?: string;
  DisplayName?: string;
  Email?: string;
  RoleName?: string;
  IsLockedOut?: boolean;
  IsLockedPermanently?: boolean;
  LoginMessage?: string;
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
      credentials: "include",
    });
  } catch {
    // Ignore fetch failures on offline
  } finally {
    clearStoredUser();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }
  return true;
}

export async function checkAuthentication(): Promise<boolean> {
  const apiUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiUrl}/api/Auth/isAuthenticated`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
