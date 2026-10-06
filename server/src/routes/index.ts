import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { meRouter } from './me.routes.js';
import { cropsRouter } from './crops.routes.js';
import { farmsRouter } from './farms.routes.js';
import { advisoriesRouter } from './advisories.routes.js';
import { recommendationsRouter } from './recommendations.routes.js';
import { diagnosesRouter } from './diagnoses.routes.js';
import { fertilizerRouter } from './fertilizer.routes.js';
import { chatRouter } from './chat.routes.js';
import { historyRouter } from './history.routes.js';
import { feedbackRouter } from './feedback.routes.js';
import { usageRouter } from './usage.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(meRouter);
apiRouter.use(cropsRouter);
apiRouter.use(farmsRouter);
apiRouter.use(advisoriesRouter);
apiRouter.use(recommendationsRouter);
apiRouter.use(diagnosesRouter);
apiRouter.use(fertilizerRouter);
apiRouter.use(chatRouter);
apiRouter.use(historyRouter);
apiRouter.use(feedbackRouter);
apiRouter.use(usageRouter);
