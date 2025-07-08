import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  return <div>ChatContainer</div>;
};

export default ChatContainer;
