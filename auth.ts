import { ExpressAuthConfig } from "@auth/express";
import Discord from "@auth/express/providers/discord";
import { consoleBob } from "./utils";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
if (!DISCORD_CLIENT_ID) {
  consoleBob("DISCORD_CLIENT_ID is not set");
  process.exit(1);
}

const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
if (!DISCORD_CLIENT_SECRET) {
  consoleBob("DISCORD_CLIENT_SECRET is not set");
  process.exit(1);
}

const IS_PRODUCTION = process.env.IS_PRODUCTION;
if (IS_PRODUCTION == undefined) {
  consoleBob("IS_PRODUCTION is not set");
  process.exit(1);
}

export const authConfig: ExpressAuthConfig = {
	providers: [
		Discord({
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET,
			authorization: 'https://discord.com/api/oauth2/authorize?scope=identify'
		})
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
		}
	},
	cookies: {
		sessionToken: {
			name: 'sessionToken',
			options: {
				httpOnly: true,
				sameSite: IS_PRODUCTION ? 'none' : 'lax',
				secure: IS_PRODUCTION == 'true' ? true : false,
				path: '/',
				domain: IS_PRODUCTION ? '.bobbynooby.dev' : undefined
			}
		}
	}
};
