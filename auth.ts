import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginCodeSchema } from "@/features/auth/schema"
import {
  ensureOwnerUser,
  getUserById,
  isAllowedEmail,
  verifyLoginCode,
} from "@/features/auth/server/login-code"

/* A failed sign-in reaches the client as `result.code`, which the sign-in
   card turns into a message (features/auth/components/sign-in-card.tsx).
   The codes say only what the owner needs to fix — never the code itself. */
class LoginCodeError extends CredentialsSignin {
  constructor(code: string) {
    super()
    this.code = code
  }
}

/* How often an open session re-checks that its email is still allowed, so
   someone the owner removes loses access within minutes, not when their
   30-day session would otherwise expire. */
const ACCESS_RECHECK_MS = 5 * 60 * 1000

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Trust the deployment host (Vercel serves behind a proxy). Without this,
  // Auth.js rejects requests as UntrustedHost in production and login fails.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    /* Passwordless: email + the one-time code emailed by /api/login-code.
       Only the owner and the emails the owner allows can sign in. */
    Credentials({
      credentials: {
        email: {},
        code: {},
      },
      authorize: async (credentials) => {
        const parsed = loginCodeSchema.safeParse(credentials)
        if (!parsed.success) throw new LoginCodeError("invalid_format")

        const result = await verifyLoginCode(parsed.data.email, parsed.data.code)
        if (!result.ok) {
          throw new LoginCodeError(
            result.reason === "invalid" ? `invalid_${result.attemptsLeft}` : result.reason
          )
        }

        const user = await ensureOwnerUser(parsed.data.email)
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role as "owner" | "stylist",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      /* Settings → Account renamed the user: re-read the name from the
         database. The client only signals that something changed — it never
         supplies the value, so it can't write its own session. */
      if (trigger === "update" && token.sub) {
        const fresh = await getUserById(token.sub)
        if (fresh) token.name = fresh.name
        return token
      }
      if (user) {
        token.role = user.role as "owner" | "stylist"
        token.accessCheckedAt = Date.now()
        return token
      }
      /* Removed from Dashboard access (or the owner's email changed)? End
         the session. Checked every few minutes, not on every request. */
      const checkedAt = typeof token.accessCheckedAt === "number" ? token.accessCheckedAt : 0
      if (token.email && Date.now() - checkedAt > ACCESS_RECHECK_MS) {
        if (!(await isAllowedEmail(token.email))) return null
        token.accessCheckedAt = Date.now()
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.role) {
        ;(session.user as { role: "owner" | "stylist" }).role = token.role as
          | "owner"
          | "stylist"
      }
      return session
    },
  },
})
