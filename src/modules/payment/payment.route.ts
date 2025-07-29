import { Router } from "express";
import { paymentController } from "./payment.module";

const webhookRoutes = Router();

webhookRoutes.post("/paystack", paymentController.handleWebhook);

export default webhookRoutes;