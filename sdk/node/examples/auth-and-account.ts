import { withTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;
const accountId = process.env.TRADE_API_ACCOUNT_ID;

if (!secret || !accountId) {
  throw new Error("Set TRADE_API_SECRET and TRADE_API_ACCOUNT_ID");
}

await withTradeApi({ secret }, async (api) => {
  const [details, account] = await Promise.all([
    api.auth.tokenDetails({ token: api.getToken() }),
    api.accounts.getAccount({ accountId }),
  ]);

  console.log("Available accounts:", details.accountIds);
  console.log("Account:", account);
});
