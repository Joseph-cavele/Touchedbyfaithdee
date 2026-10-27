import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = req.auth.user.role

  if (pathname.startsWith("/dashboard") && role !== "owner") {
    return NextResponse.redirect(new URL("/stylist", req.nextUrl))
  }

  if (pathname.startsWith("/stylist") && role !== "stylist") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/stylist/:path*"],
}
