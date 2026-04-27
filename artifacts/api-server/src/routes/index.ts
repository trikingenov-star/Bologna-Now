import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import aiRouter from "./ai";
import placesRouter from "./places";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(aiRouter);
router.use(placesRouter);

export default router;
