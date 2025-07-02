const {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
    CreateSdkOrderRequest,
  } = require("pg-sdk-node");
  require("dotenv").config();
  const { randomUUID } = require("crypto");
  
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
  const env = process.env.PHONEPE_ENV === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX;
  
  const client = StandardCheckoutClient.getInstance(
    clientId,
    clientSecret,
    clientVersion,
    env
  );
  
  class PhonePeService {
    async initiateCheckoutPagePayment(amount, redirectUrl, customerDetails) {
      try {
        const merchantOrderId = randomUUID();
        
        const request = StandardCheckoutPayRequest.builder()
          .merchantOrderId(merchantOrderId)
          .amount(amount * 100) // Convert to paise
          .redirectUrl(redirectUrl)
          .build();
  
        const response = await client.pay(request);
        
        return {
          success: true,
          merchantOrderId,
          redirectUrl: response.redirectUrl,
          customerDetails,
        };
      } catch (error) {
        console.error("PhonePe payment initiation error:", error);
        throw new Error("Failed to initiate payment");
      }
    }
  
    async initiateSdkTokenPayment(amount, redirectUrl) {
      try {
        const merchantOrderId = randomUUID();
  
        const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
          .merchantOrderId(merchantOrderId)
          .amount(amount * 100) // Convert to paise
          .redirectUrl(redirectUrl)
          .build();
  
        const response = await client.createSdkOrder(request);
        
        return {
          success: true,
          merchantOrderId,
          token: response.token,
        };
      } catch (error) {
        console.error("PhonePe SDK token error:", error);
        throw new Error("Failed to create SDK order");
      }
    }
  
    async getOrderStatus(merchantOrderId) {
      try {
        const response = await client.getOrderStatus(merchantOrderId);
        return {
          success: true,
          state: response.state,
          data: response,
        };
      } catch (error) {
        console.error("PhonePe order status error:", error);
        throw new Error("Failed to get order status");
      }
    }
  
    async validateCallback(username, password, authorization, responseBodyString) {
      try {
        const callback = client.validateCallback(
          username,
          password,
          authorization,
          responseBodyString
        );
        return {
          success: true,
          orderId: callback.payload.orderId,
          state: callback.payload.state,
        };
      } catch (error) {
        console.error("PhonePe callback validation error:", error);
        throw new Error("Failed to validate callback");
      }
    }
  }
  
  module.exports = PhonePeService;
  