import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

const GLOBAL_GROUP_ID = "global";

export const getGroupMessages = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const messages = await Message.find({
      messageType: { $in: ["group", "system"] },
      groupId: GLOBAL_GROUP_ID,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "fullName profilePic");

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      text,
      image: imageUrl,
      messageType: "group",
      groupId: GLOBAL_GROUP_ID,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "fullName profilePic");

    io.emit("newGroupMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
