import { Router } from "express";
import { paymentController } from "./payment.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";

const paymentRoute = Router();

paymentRoute.post("/paystack", paymentController.handleWebhook);
paymentRoute.get(
  "/checkout",
  authenticateJWT,
  paymentController.initializeCheckout
);
paymentRoute.get(
  "/verify",
  authenticateJWT,
  paymentController.verifyPayment
);

export default paymentRoute;