package example

import grpc.tradeapi.v1.accounts.GetAccountRequest
import kotlinx.coroutines.runBlocking
import com.yourbrand.tradeapi.tradeAPIClient

const val TRADE_API_SECRET = "TRADE_API_SECRET"

object GetAccount {
    @JvmStatic
    fun main(args: Array<String>) = runBlocking {
        System.setProperty("logback.configurationFile", "/logback.xml")

        val client = tradeAPIClient {
            secret = System.getenv(TRADE_API_SECRET)
            if (secret.isNullOrEmpty()) {
                "Environment variable '$TRADE_API_SECRET' is required".also {
                    throw RuntimeException(it)
                }
            }
        }
        client.start().collect { details ->
            details.accountIdsList.forEach { accountId ->
                client.accountsServiceStub()
                    .getAccount(
                        GetAccountRequest.newBuilder()
                            .setAccountId(accountId)
                            .build()
                    )
                    .also { acc ->
                        println("Account ID: ${acc.accountId}")
                        acc.cashList.forEach { cash -> println("${cash.currencyCode}: ${cash.units}") }
                        println()
                    }
            }
        }
    }
}
