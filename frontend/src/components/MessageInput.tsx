import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const lastTypingTimeRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  const handleImageChange = (e) => {
    //e.target.files: 这是文件输入框最独特的属性。它不是一个简单的字符串值，而是一个 FileList 对象。可以把它看作一个只读的、类似数组的列表，里面装着用户选择的所有文件。
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
  };

  const removeImage = () => {
    setImagePreview(null);
    //保证 onChange 事件能够被可靠地触发
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Typing logic
    if (!socket || !selectedUser) return;

    const now = Date.now();
    const throttleDelay = 2000; // 2 seconds

    // Emit typing event (Throttled)
    if (now - lastTypingTimeRef.current > throttleDelay) {
      socket.emit("typing", { receiverId: selectedUser._id });
      lastTypingTimeRef.current = now;
    }

    // Clear previous stop timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set new stop timer (Debounced)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
      typingTimeoutRef.current = null;
    }, 3000); // Stop typing after 3s of inactivity
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Emit stopTyping immediately when message is sent
      if (socket && selectedUser) {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="预览"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              //为什么会重新渲染
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
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
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            //？
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
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
  );
};
export default MessageInput;
