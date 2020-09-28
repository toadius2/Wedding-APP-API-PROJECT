import { BasicRouter } from "../basicrouter";
import { UsersRouter } from "./users";
import { DevicesRouter } from "./devices";
import { LoginRouter } from "./login";

export const Router: BasicRouter[] = [new UsersRouter(), new DevicesRouter(), new LoginRouter()]