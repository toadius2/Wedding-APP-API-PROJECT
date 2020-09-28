import * as express from "express"
import { APIRequest, APIResponse } from "../basicrouter"

export default function applyCORS(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method == "OPTIONS") {
        res.jsonContent({})
    } else
        next();
}