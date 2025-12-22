import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  // Access Token: 15分钟
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Refresh Token: 7天
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // 设置 Access Token Cookie
  res.cookie("jwt", accessToken, {
    maxAge: 15 * 60 * 1000, // 15分钟
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  // 设置 Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return accessToken;
};
