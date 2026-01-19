import express from "express";
//protectRoute 是一个中间件，用于验证用户身份
//作用：检查请求是否携带有效的 JWT
//如果无效，返回 401 错误
//如果有效，将用户信息挂载到 req.user
//然后调用 summarizeGroupChat 控制器
import { protectRoute } from "../middleware/auth.middleware.js";
import { summarizeGroupChat } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/summarize-group", protectRoute, summarizeGroupChat);

export default router;
