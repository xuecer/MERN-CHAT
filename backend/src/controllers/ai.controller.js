import OpenAI from "openai";
import Message from "../models/message.model.js";

// 使用硅基流动API（兼容OpenAI格式）
const client = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1",
});

// 全局群聊 ID（暂时写死）
const GLOBAL_GROUP_ID = "global";

// 总结群聊控制器，接受请求和响应，接受 messageCount 参数，表示要总结的消息数量 （默认50条）
export const summarizeGroupChat = async (req, res) => {
  try {
    // 获取请求体中的 messageCount 参数，如果未提供，则使用默认值50
    const { messageCount = 50 } = req.body;
    // 获取当前用户（通过 protectRoute 中间件挂载到 req.user）
    const currentUser = req.user;

    // 获取最近的群聊消息（根据创建时间排序，获取最近的 messageCount 条消息）
    const messages = await Message.find({
      messageType: "group", // 只获取群聊消息
      groupId: GLOBAL_GROUP_ID, // 全局群聊 ID
    })
      .sort({ createdAt: -1 })
      .limit(messageCount)
      .populate("senderId", "fullName");

    if (messages.length === 0) {
      return res.status(200).json({ summary: "暂无消息需要总结" });
    }

    // 构建对话文本
    // 将消息列表反转，然后映射为 "发送者: 消息内容" 的格式，最后用换行符连接成一个字符串
    const conversationText = messages
      .reverse()
      .map((m) => `${m.senderId.fullName}: ${m.text || "[图片]"}`)
      .join("\n");

    // 构建提示词
    const prompt = `你是一个群聊助手。请用简洁的中文总结最近的群聊内容。

**严格按照以下格式输出**：

## 📌 主要话题
- 话题1：简短描述（不超过20字）
- 话题2：简短描述
- 话题3：简短描述

## 💬 活跃讨论
- 谁说的最多、讨论最热烈的内容
- 大家的观点和态度

## 💡 关键结论
- 达成的共识或重要决定
- 需要注意的事项

---
最近 ${messageCount} 条群聊内容：
${conversationText}`;

    // 设置 SSE 响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 调用硅基流动 API（使用Qwen模型）
    const stream = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的群聊总结助手。请用简洁、结构化的中文总结群聊内容，使用emoji增强可读性。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "Qwen/Qwen2.5-7B-Instruct", // 免费且快速的中文模型
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });

    // 流式发送数据
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 发送结束标记
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in summarizeGroupChat:", error);
    res.write(
      `data: ${JSON.stringify({ error: "AI总结失败，请稍后重试" })}\n\n`
    );
    res.end();
  }
};
