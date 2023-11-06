import { APP_ROUTES } from "@/src/routes";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: APP_ROUTES.public.login,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith(
        APP_ROUTES.private.root,
      );

      const isOnLogin = nextUrl.pathname.startsWith(APP_ROUTES.public.login);

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL(APP_ROUTES.private.root, nextUrl));
      }

      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
