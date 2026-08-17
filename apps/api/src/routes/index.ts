import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/require-auth";
import { procurementErrorHandler } from "../middleware/error-handler";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import requisitionsRouter from "./requisitions";
import approvalsRouter from "./approvals";
import purchaseOrdersRouter from "./purchase-orders";
import vendorsRouter from "./vendors";
import receivingRouter from "./receiving";
import invoicesRouter from "./invoices";
import paymentsRouter from "./payments";
import budgetsRouter from "./budgets";
import analyticsRouter from "./analytics";
import policiesRouter from "./policies";
import auditLogRouter from "./audit-log";

const router: IRouter = Router();

// Health check stays outside auth so uptime probes don't need credentials.
router.use(healthRouter);

router.use(requireAuth);
router.use(dashboardRouter);
router.use(requisitionsRouter);
router.use(approvalsRouter);
router.use(purchaseOrdersRouter);
router.use(vendorsRouter);
router.use(receivingRouter);
router.use(invoicesRouter);
router.use(paymentsRouter);
router.use(budgetsRouter);
router.use(analyticsRouter);
router.use(policiesRouter);
router.use(auditLogRouter);

router.use(procurementErrorHandler);

export default router;
