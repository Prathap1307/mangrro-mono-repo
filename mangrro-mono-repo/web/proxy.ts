// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/cart(.*)",
  "/account(.*)",
  "/checkout(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth(); // ← FIXED: await

  // Block protected pages unless logged in
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return;
});

// REQUIRED FOR CLERK TO WORK IN API ROUTES
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/api/(.*)",  // ← MAKE SURE THIS IS PRESENT
  ],
};
