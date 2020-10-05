import { BasicRouter } from "../basicrouter";
import { UsersRouter } from "./users";
import { DevicesRouter } from "./devices";
import { LoginRouter } from "./login";
import { BudgetItemRouter } from "./budget_item";
import { WeddingRouter } from "./wedding";

export const Router: BasicRouter[] = [new UsersRouter(), new DevicesRouter(), new LoginRouter(), new BudgetItemRouter(), new WeddingRouter()];