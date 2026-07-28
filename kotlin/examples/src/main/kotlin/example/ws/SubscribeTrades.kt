package example.ws

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import com.yourbrand.tradeapi.MessageType
import com.yourbrand.tradeapi.SubscriptionType
import com.yourbrand.tradeapi.WsRequest
import com.yourbrand.tradeapi.parseEnv

object SubscribeTrades : WsSubscriptionBaseExample() {
    private val logger: Logger = LoggerFactory.getLogger(SubscribeTrades::class.java)

    @JvmStatic
    fun main(args: Array<String>) {
        val accountId = "your-account-id"
        val subscribeRequest = WsRequest.subscribeTradesRequest(accountId)
        run(subscribeRequest) { message ->
            val envelope = parseEnv(message) ?: throw RuntimeException("Failed to parse envelope $message")

            when (envelope.type) {
                MessageType.DATA -> {
                    if (envelope.subscriptionType == SubscriptionType.TRADES) {
                        logger.info("Received trades for account=$accountId: \n {}", message)
                    }
                }

                MessageType.EVENT -> logger.info("Event received: ${envelope.eventInfo}")
                MessageType.ERROR -> logger.error("Error received: ${envelope.errorInfo}")
            }
        }
    }

}
