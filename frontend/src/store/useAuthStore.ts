import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

// 配置参数
const HEARTBEAT_INTERVAL_VISIBLE = 30000; // 页面可见时：30秒心跳
const HEARTBEAT_INTERVAL_HIDDEN = 60000; // 页面不可见时：60秒心跳（降低频率）
const RECONNECT_DELAY_BASE = 1000; // 基础重连延迟（1秒）
const MAX_RECONNECT_DELAY = 30000; // 最大重连延迟（30秒）
const MAX_RECONNECT_ATTEMPTS = 10; // 最大重连次数
const DEBOUNCE_DELAY = 300; // 防抖延迟（300毫秒）

// 连接状态类型
type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "reconnecting";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  connectionStatus: "disconnected" as ConnectionStatus,
  reconnectAttempts: 0,
  reconnectTimer: null as NodeJS.Timeout | null,
  heartbeatTimer: null as NodeJS.Timeout | null,
  pingTimeoutTimer: null as NodeJS.Timeout | null, // 新增：用于清理单次Ping的超时检测
  debounceTimer: null as NodeJS.Timeout | null,
  lastPingTime: 0,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("账号创建成功");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("登录成功");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("退出登录成功");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("个人资料更新成功");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // 防抖处理
    const { debounceTimer } = get();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newDebounceTimer = setTimeout(() => {
      get()._connectSocket();
    }, DEBOUNCE_DELAY);

    set({ debounceTimer: newDebounceTimer });
  },
  // 启动心跳检测
  startHeartbeat: () => {
    const { heartbeatTimer } = get();

    // 清理现有心跳
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    // 根据页面可见性决定心跳间隔
    const interval = document.hidden
      ? HEARTBEAT_INTERVAL_HIDDEN
      : HEARTBEAT_INTERVAL_VISIBLE;

    console.log(
      `Starting heartbeat with interval: ${interval}ms (hidden: ${document.hidden})`
    );

    // 设置新的心跳
    const newHeartbeatTimer = setInterval(() => {
      const { socket } = get();
      if (!socket || !socket.connected) {
        get().stopHeartbeat();
        return;
      }

      set({ lastPingTime: Date.now() });
      socket.emit("ping");

      // 设置超时检测
      setTimeout(() => {
        const { lastPingTime } = get();
        // 修复逻辑：如果 lastPingTime 仍不为 0，说明在5秒内没有收到 pong 重置它
        // 不需要计算时间差，只要标志位没复位就是超时
        if (lastPingTime !== 0) {
          console.log("Heartbeat timeout, reconnecting...");
          socket.disconnect();
          // disconnect 事件会自动触发 scheduleReconnect
        }
      }, 5000);
    }, interval);

    set({ heartbeatTimer: newHeartbeatTimer });
  },

  // 页面可见性变化处理
  handleVisibilityChange: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      get().startHeartbeat();
    }
  },

  // 停止心跳检测
  stopHeartbeat: () => {
    const { heartbeatTimer } = get();
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      set({ heartbeatTimer: null });
    }
  },

  // 安排重连
  scheduleReconnect: () => {
    const { reconnectTimer, reconnectAttempts } = get();

    // 取消现有重连计划
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    // 检查重连次数
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("Max reconnect attempts reached");
      toast.error("无法连接到服务器，请检查网络连接");
      return;
    }

    // 使用指数退避算法计算延迟
    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    set({ connectionStatus: "reconnecting" });
    console.log(
      `Scheduling reconnect in ${delay}ms, attempt ${reconnectAttempts + 1}`
    );

    // 设置重连定时器
    const newReconnectTimer = setTimeout(() => {
      set({ reconnectAttempts: get().reconnectAttempts + 1 });
      get()._connectSocket();
    }, delay);

    set({ reconnectTimer: newReconnectTimer });
  },

  // 取消重连
  cancelReconnect: () => {
    const { reconnectTimer } = get();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      set({ reconnectTimer: null });
    }
  },

  // 内部连接实现
  _connectSocket: () => {
    const { authUser, socket, connectionStatus } = get();

    // 避免重复连接 (增加 connecting 状态检查)
    if (socket?.connected || connectionStatus === "connecting") return;

    // 如果已有socket，先断开
    if (socket) {
      get().disconnectSocket();
    }

    // 更新状态
    set({ connectionStatus: "connecting" });

    // 创建socket连接
    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      reconnection: false, // 禁用自动重连，我们自己管理重连
    });

    // 连接事件
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      set({
        reconnectAttempts: 0,
        connectionStatus: "connected",
      });
      get().startHeartbeat();

      // 监听页面可见性变化
      document.addEventListener(
        "visibilitychange",
        get().handleVisibilityChange
      );
    });

    // 监听心跳响应 (新增位置)
    newSocket.on("pong", () => {
      set({ lastPingTime: 0 }); // 重置，表示收到响应
    });

    // 断开事件
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ connectionStatus: "disconnected" });
      get().stopHeartbeat();

      // 如果不是主动断开，尝试重连
      if (reason !== "io client disconnect") {
        get().scheduleReconnect();
      }
    });

    // 连接错误
    newSocket.on("connect_error", (error) => {
      console.log("Socket connect error:", error);
      get().scheduleReconnect();
    });

    // 监听在线用户事件
    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // 手动连接
    newSocket.connect();

    // 保存socket实例
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();

    // 停止心跳
    get().stopHeartbeat();

    // 取消重连
    get().cancelReconnect();

    // 断开连接
    if (socket?.connected) {
      socket.disconnect();
    }

    // 更新状态
    set({
      socket: null,
      connectionStatus: "disconnected",
    });
  },
}));
