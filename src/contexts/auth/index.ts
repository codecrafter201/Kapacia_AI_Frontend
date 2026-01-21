// Export auth context and types from the auth subfolder
export { AuthContext } from "./AuthContext";
export type { UserData } from "./AuthContext";

// Re-export provider from parent context file
export { AuthProvider } from "../AuthContext";

// Export useAuth hook
export { useAuth } from "../useAuth";
