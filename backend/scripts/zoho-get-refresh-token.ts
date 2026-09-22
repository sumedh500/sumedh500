// One-time setup script: exchanges a Self Client "grant token" for a
// long-lived refresh token. Run once per Zoho org, then paste the printed
// refresh token into ZOHO_REFRESH_TOKEN in your .env — the running
// backend never calls this, it only uses zohoClient's refresh_token flow.
//
// How to get a grant token: Zoho API Console -> your Self Client ->
// "Generate Code" -> paste the CRM scopes below -> copy the code shown
// (it's only valid for a few minutes, so run this script right after).
//
// Usage:
//   npx tsx scripts/zoho-get-refresh-token.ts <grantToken>
//
// Requires ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_DC already set in .env.

import "dotenv/config";
import { exchangeGrantTokenForRefreshToken } from "../src/services/zoho/zohoClient";

async function main() {
  const grantToken = process.argv[2];

  if (!grantToken) {
    console.error("Usage: npx tsx scripts/zoho-get-refresh-token.ts <grantToken>");
    process.exit(1);
  }

  const clientId = process.env.ZOHO_CLIENT_ID ?? "";
  const clientSecret = process.env.ZOHO_CLIENT_SECRET ?? "";
  const dataCenter = process.env.ZOHO_DC ?? "com";

  if (!clientId || !clientSecret) {
    console.error("Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in .env first.");
    process.exit(1);
  }

  // Printed so you can self-diagnose invalid_client: this MUST be the same
  // accounts server (same DC) shown in the URL of the API Console page
  // where you created the Self Client and generated the grant token.
  console.log(`Exchanging against https://accounts.zoho.${dataCenter} (ZOHO_DC=${dataCenter})`);
  console.log(`Using Client ID: ${clientId.slice(0, 10)}...\n`);

  const result = await exchangeGrantTokenForRefreshToken({
    grantToken,
    clientId,
    clientSecret,
    dataCenter,
  });

  console.log("\nSuccess. Add this to your .env:\n");
  console.log(`ZOHO_REFRESH_TOKEN=${result.refresh_token}\n`);
  console.log(`(access token from this exchange expires in ${result.expires_in}s — ignore it, the backend mints its own from the refresh token above.)`);
}

main().catch((error) => {
  const zohoError = error.response?.data?.error;

  if (zohoError === "invalid_client") {
    console.error(
      "\ninvalid_client — the Client ID/Secret don't match a Self Client on this accounts server.\n" +
        "Most common cause: ZOHO_DC in .env doesn't match the region your Self Client was created in.\n" +
        "Check the URL of the Zoho API Console page you used (api-console.zoho.<DC>) and make sure\n" +
        "ZOHO_DC in .env is exactly that <DC> (com / in / eu / com.au / jp / ca / sa).\n" +
        "Also double-check the Client ID/Secret were copied from the SAME Self Client that generated this grant token.\n"
    );
    process.exit(1);
  }

  console.error("Grant token exchange failed:", error.response?.data ?? error.message ?? error);
  process.exit(1);
});
