import { createAuthClient } from "better-auth/react";

// Use relative URL to work with any hostname
export const authClient = createAuthClient({
  baseURL: "", // Empty string means use current origin
});

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  changePassword
} = authClient;