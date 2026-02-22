import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // No baseURL: Better Auth will automatically use the same origin as the Next.js app.
    // This avoids hardcoded port issues when the dev server picks a different port.
});

export const { signIn, signUp, signOut, useSession } = authClient;
