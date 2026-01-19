import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
    profilePic: string;
  };
  text?: string;
  image?: string;
  messageType: "group" | "system";
  createdAt: string;
}

interface GroupChatStore {
  messages: Message[];
  isMessagesLoading: boolean;

  getMessages: () => Promise<void>;
  sendMessage: (messageData: {
    text?: string;
    image?: string;
  }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  addChunkMessage: (content: string) => void;
}

export const useGroupChatStore = create<GroupChatStore>((set, get) => ({
  messages: [],
  isMessagesLoading: false,

  getMessages: async () => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get("/group/messages");
      set({ messages: res.data });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "加载消息失败";
      toast.error(errorMessage);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    try {
      await axiosInstance.post("/group/send", messageData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "发送失败";
      toast.error(errorMessage);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket as any;
    if (!socket) return;

    socket.on("newGroupMessage", (newMessage: Message) => {
      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket as any;
    if (!socket) return;
    socket.off("newGroupMessage");
  },

  addChunkMessage: (content: string) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.messageType === "system") {
        lastMessage.text = (lastMessage.text || "") + content;
      } else {
        messages.push({
          _id: `system-${Date.now()}`,
          senderId: {
            _id: "system",
            fullName: "AI 助手",
            profilePic: "/logo.png",
          },
          text: content,
          messageType: "system",
          createdAt: new Date().toISOString(),
        });
      }

      return { messages };
    });
  },
}));
