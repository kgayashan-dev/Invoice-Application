export interface StoredUser {
  fullName: string;
  userName: string;
  loginID: string;
  roleName: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const fullName = localStorage.getItem("FullName");
  const userName = localStorage.getItem("UserName");
  const loginID = localStorage.getItem("loginID");
  const roleName = localStorage.getItem("RoleName") || "";
  if (!fullName && !userName) return null;
  return {
    fullName: fullName || "",
    userName: userName || "",
    loginID: loginID || "",
    roleName: roleName || "User"
  };
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("FullName");
  localStorage.removeItem("UserName");
  localStorage.removeItem("loginID");
  localStorage.removeItem("RoleName");
  localStorage.removeItem("token");
  localStorage.removeItem("LoginMessage");
  localStorage.removeItem("userPermissions");
  sessionStorage.clear();
}

export function getInitials(fullName: string): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function getUserRole(userName: string): string {
  if (userName?.toLowerCase() === "admin") return "System Administrator";
  return "User";
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const user = getStoredUser();
    if (user?.loginID || user?.userName) {
      headers["X-User-ID"] = user.loginID || user.userName;
      headers["X-UserName"] = user.userName || user.loginID;
      if (user.roleName) {
        headers["X-User-Role"] = user.roleName;
      }
    }
  }
  return headers;
}
