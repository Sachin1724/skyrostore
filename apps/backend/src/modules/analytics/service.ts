import { MedusaService } from "@medusajs/framework/utils";
import { AnalyticsEvent } from "./models/analytics-event";
import { PaymentAttempt } from "./models/payment-attempt";

class AnalyticsModuleService extends MedusaService({ AnalyticsEvent, PaymentAttempt }) {}

export default AnalyticsModuleService;
