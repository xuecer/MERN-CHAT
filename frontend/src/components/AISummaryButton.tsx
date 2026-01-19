import { useState } from "react";
import { Sparkles, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useBufferedUpdate } from "../hooks/useBufferedUpdate";

export const AISummaryButton = () => {
  // 是否正在生成总结，防止重复点击
  const [isGenerating, setIsGenerating] = useState(false);
  // 添加 chunk 消息
  const { addChunkMessage } = useGroupChatStore();

  // 使用 bufferedUpdate 优化性能
  const { addChunk } = useBufferedUpdate((chunks) => {
    // 将 chunk 连接成一个字符串
    addChunkMessage(chunks.join(""));
  });

  const handleGenerateSummary = async () => {
    // 设置正在生成总结
    setIsGenerating(true);
    // 清空 chunk 消息
    addChunkMessage("");

    try {
      // 发送总结请求
      const response = await fetch(
        `${
          import.meta.env.MODE === "development" ? "http://localhost:5001" : ""
        }/api/ai/summarize-group`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messageCount: 50 }),
        }
      );

      if (!response.ok) throw new Error("网络请求失败");
      // 读取响应流，不能直接读取 stream：response.stream()，因为response.stream()返回的是一个ReadableStream，而不是一个普通的Stream。需要先获取 reader：reader.read() 读取流式数据
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.done) break;
              if (data.content) addChunk(data.content);
            } catch (parseError) {
              console.error("JSON解析错误:", parseError);
            }
          }
        }
      }

      setIsGenerating(false);
      toast.success("总结完成");
    } catch (error: any) {
      setIsGenerating(false);
      toast.error("总结失败");
      console.error("AI Summary Error:", error);
    }
  };

  return (
    <button
      onClick={handleGenerateSummary}
      disabled={isGenerating}
      className="btn btn-sm gap-2"
    >
      {isGenerating ? (
        <>
          <Loader size={16} className="animate-spin" />
          <span>总结中...</span>
        </>
      ) : (
        <>
          <Sparkles size={16} />
          <span>AI总结</span>
        </>
      )}
    </button>
  );
};
