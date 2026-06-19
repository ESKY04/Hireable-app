import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/orders(.*)",
  "/request(.*)",
  "/admin(.*)",
])

export default clerkMiddleware((auth, req) => {
  if (isProtected(req)) {
    // protect() exists at runtime in Clerk 5.x; type definitions lag in 5.7.6
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(auth as any).protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
