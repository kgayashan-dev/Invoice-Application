// Provides shared error helpers used by frontend features.
/**
 * Standardized API error normalizer for enterprise frontend error handling.
 * Strips raw SQL / technical stack traces and presents user-friendly messages.
 */

export function normalizeApiError(error: unknown, fallbackMessage = "An unexpected error occurred. Please try again."): string {
  if (!error) return fallbackMessage;

  if (typeof error === "string") {
    return cleanErrorMessage(error, fallbackMessage);
  }

  if (typeof error === "object") {
    const err = error as Record<string, unknown>;

    // 1. Check response.data if Axios or similar
    if (err.response && typeof err.response === "object") {
      const resp = err.response as Record<string, unknown>;
      if (resp.data) {
        return normalizeApiError(resp.data, fallbackMessage);
      }
    }

    // 2. Check direct fields: message, error, title, detail
    if (typeof err.message === "string" && err.message.trim()) {
      return cleanErrorMessage(err.message, fallbackMessage);
    }
    if (typeof err.error === "string" && err.error.trim()) {
      return cleanErrorMessage(err.error, fallbackMessage);
    }
    if (typeof err.detail === "string" && err.detail.trim()) {
      return cleanErrorMessage(err.detail, fallbackMessage);
    }
    if (typeof err.title === "string" && err.title.trim()) {
      return cleanErrorMessage(err.title, fallbackMessage);
    }

    // 3. Check ModelState validation errors: { errors: { field: ["msg1", "msg2"] } }
    if (err.errors && typeof err.errors === "object") {
      const errorObj = err.errors as Record<string, unknown>;
      const messages: string[] = [];
      for (const key of Object.keys(errorObj)) {
        const val = errorObj[key];
        if (Array.isArray(val)) {
          messages.push(...val.filter((v): v is string => typeof v === "string"));
        } else if (typeof val === "string") {
          messages.push(val);
        }
      }
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
  }

  return fallbackMessage;
}

// Performs clean error message for this feature.
function cleanErrorMessage(msg: string, fallback: string): string {
  const trimmed = msg.trim();
  if (!trimmed) return fallback;

  // Don't expose internal stack traces or connection strings
  if (
    trimmed.includes("Microsoft.Data.SqlClient") ||
    trimmed.includes("System.Data") ||
    trimmed.includes("Stack trace:") ||
    trimmed.includes("SqlException")
  ) {
    // If it contains a friendly message before or after, try extracting it
    const match = trimmed.match(/error:\s*([^.\n]+)/i);
    if (match && match[1] && !match[1].includes("SqlClient")) {
      return match[1].trim();
    }
    return "A database operation failed. Please verify your inputs or contact system administration.";
  }

  return trimmed;
}
