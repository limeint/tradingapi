import { withTradeApi } from "@limeint/trade-api";

const secret = process.env.TRADE_API_SECRET;

if (!secret) {
  throw new Error("Set TRADE_API_SECRET");
}

await withTradeApi({ secret }, async (api) => {
  const details = await api.auth.tokenDetails({ token: api.getToken() });
  const [accountId] = details.accountIds;
  if (details.accountIds.length !== 1 || !accountId) {
    throw new Error(
      `Expected exactly one available account; received ${details.accountIds.length}`,
    );
  }
  const account = await api.accounts.getAccount({ accountId });

  console.log("Available accounts:", details.accountIds);
  console.log("Account:", account);
});
