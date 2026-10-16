import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that unauthenticated users can access
const isPublicRoute = createRouteMatcher([
  "/",
  "/anime(.*)",
  "/manga(.*)",
  "/games(.*)",
  "/movies(.*)",
  "/series(.*)",
  "/friends(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/login(.*)",
  "/register(.*)",
  "/auth(.*)",
  "/admin(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
