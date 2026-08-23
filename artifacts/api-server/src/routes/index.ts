import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import customerRouter from "./customer";
import checkoutRouter from "./checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(customerRouter);
router.use(checkoutRouter);

export default router;
