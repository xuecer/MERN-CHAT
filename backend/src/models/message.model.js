import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // 群聊消息不需要receiverId
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["private", "group", "system"],
      default: "private",
    },
    groupId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
