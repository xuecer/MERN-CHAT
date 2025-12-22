import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

import { Virtuoso } from "react-virtuoso";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    socket,
  ]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <Virtuoso
        style={{ flex: 1, overflowX: "hidden" }}
        data={messages}
        // 自动滚动到底部行为：平滑滚动
        followOutput="smooth"
        // 初始位置：直接显示最后一条消息
        initialTopMostItemIndex={messages.length - 1}
        // 列表样式：保持原有的 padding 和 spacing
        // 修复：移除 space-y-4，因为它在 Virtuoso 中可能导致计算错误；
        // 移除 p-4 放到内部 div 或通过 css 处理，这里先保留 p-4 但确保 overflow-x 隐藏
        className="w-full"
        itemContent={(index, message) => (
          <div
            key={message._id}
            // 修复：将 p-4 移到这里或确保外层不溢出
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            } px-4 pb-4`}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="头像"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="附件"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        )}
      />

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
