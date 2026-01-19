import { useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { AISummaryButton } from "./AISummaryButton";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage,
  } = useGroupChatStore();

  const { authUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    getMessages();
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [getMessages, subscribeToMessages, unsubscribeFromMessages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview || undefined,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 头部 */}
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">全局群聊</h3>
            <p className="text-sm text-base-content/70">所有用户共享</p>
          </div>
          <AISummaryButton />
        </div>
      </div>

      {/* 消息列表 */}
      <Virtuoso
        style={{ flex: 1, overflowAnchor: "auto" }}
        data={messages}
        followOutput="smooth"
        initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
        itemContent={(index, message) => (
          <div
            key={message._id}
            className={`chat ${
              message.messageType === "system"
                ? "chat-start"
                : message.senderId._id === authUser?._id
                ? "chat-end"
                : "chat-start"
            } px-4 pb-4`}
          >
            {/* 头像 */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={message.senderId.profilePic || "/avatar.png"}
                  alt={message.senderId.fullName}
                />
              </div>
            </div>

            {/* 名字和时间 */}
            <div className="chat-header mb-1">
              <span className="font-medium">{message.senderId.fullName}</span>
              <time className="text-xs opacity-50 ml-2">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            {/* 消息内容 */}
            <div className="chat-bubble flex flex-col max-w-[70%]">
              {message.image && (
                <img
                  src={message.image}
                  alt="附件"
                  className="max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && (
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
            </div>
          </div>
        )}
      />

      {/* 输入框 */}
      <div className="p-4 w-full border-t border-base-300">
        {imagePreview && (
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              <img
                src={imagePreview}
                alt="预览"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full 
                         bg-base-300 flex items-center justify-center"
                type="button"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="w-full input input-bordered rounded-lg input-sm sm:input-md"
              placeholder="输入消息..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <button
              type="button"
              className={`hidden sm:flex btn btn-circle ${
                imagePreview ? "text-emerald-500" : "text-zinc-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
          </div>
          <button
            type="submit"
            className="btn btn-sm btn-circle"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChatContainer;
