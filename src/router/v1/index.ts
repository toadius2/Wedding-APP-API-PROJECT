import { BasicRouter } from "../basicrouter";
import { UsersRouter } from "./users";
import { DevicesRouter } from "./devices";
import { LoginRouter } from "./login";
import { BudgetItemRouter } from "./budget_item";
import { WeddingRouter } from "./wedding";
import { EventsRouter } from "./events";
import { WeddingTaskRouter } from './wedding_task';
import { WeddingTimelineRouter } from "./wedding_timeline";
import { VendorRouter } from "./vendor";
import { InvoiceRouter } from "./invoice";
import { WeddingGuestRouter } from "./wedding_guest";

export const Router: BasicRouter[] = [new UsersRouter(), new DevicesRouter(),
new LoginRouter(), new BudgetItemRouter(), new WeddingRouter(),
new EventsRouter(), new WeddingTaskRouter(), new WeddingTimelineRouter(),
new VendorRouter(), new InvoiceRouter(), new WeddingGuestRouter()];