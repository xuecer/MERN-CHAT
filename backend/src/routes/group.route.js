import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getGroupMessages,
  sendGroupMessage,
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/messages", protectRoute, getGroupMessages);
router.post("/send", protectRoute, sendGroupMessage);

export default router;

