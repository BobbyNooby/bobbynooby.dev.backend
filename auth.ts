import { ExpressAuthConfig } from "@auth/express";
import Discord from "@auth/express/providers/discord";

export const authConfig: ExpressAuthConfig = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile) {
        token.id = profile.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token.id as string;
      return session;
    },
  },
};
