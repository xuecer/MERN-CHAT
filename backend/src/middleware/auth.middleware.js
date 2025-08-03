import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }
    //verify 函数会做三件事:
    //验证签名: 它会使用相同的密钥和算法，重新计算令牌的签名，并与令牌自带的签名进行比对。如果不匹配，说明令牌曾被篡改。
    // 检查过期时间: 如果你在签发令牌时设置了过期时间 (expiresIn)，verify 会检查当前时间是否已经超过了过期时间。
    //返回载荷: 如果以上所有检查都通过，verify 函数会返回令牌的载荷 (payload)——也就是当初我们存入令牌中的数据（比如 { userId: 'some-id' }）。
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
    //  -password 唯独不返回 password 字段
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
