import { MedusaService } from "@medusajs/framework/utils";
import { AuditLog } from "./models/audit-log";

class AuditModuleService extends MedusaService({ AuditLog }) {}

export default AuditModuleService;
