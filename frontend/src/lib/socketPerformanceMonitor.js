import { usePerformanceStore } from "../store/usePerformanceStore";

// Socket性能监控工具
const socketPerformanceMonitor = {
  // 记录Socket连接开始
  connectionStart: {},

  // 监控Socket连接
  monitorSocketConnect: (socket) => {
    if (!socket) return;

    // 记录连接开始时间
    const startTime = Date.now();
    socketPerformanceMonitor.connectionStart[socket.id] = startTime;

    // 监听连接事件
    socket.on("connect", () => {
      const { recordSocketOperation } = usePerformanceStore.getState();
      const duration =
        Date.now() -
        (socketPerformanceMonitor.connectionStart[socket.id] || Date.now());

      recordSocketOperation("connect", duration, {
        socketId: socket.id,
      });

      // 清除连接开始时间
      delete socketPerformanceMonitor.connectionStart[socket.id];
    });

    // 监听断开连接事件
    socket.on("disconnect", (reason) => {
      const { recordSocketOperation } = usePerformanceStore.getState();

      recordSocketOperation("disconnect", 0, {
        socketId: socket.id,
        reason,
      });
    });

    // 监听重连尝试
    socket.on("reconnect_attempt", (attempt) => {
      const { recordSocketOperation } = usePerformanceStore.getState();

      recordSocketOperation("reconnect_attempt", 0, {
        socketId: socket.id,
        attempt,
      });

      // 记录重连开始时间
      socketPerformanceMonitor.connectionStart[socket.id] = Date.now();
    });

    // 监听错误
    socket.on("error", (error) => {
      const { recordSocketOperation } = usePerformanceStore.getState();

      recordSocketOperation("error", 0, {
        socketId: socket.id,
        error: error?.message,
      });
    });

    return socket;
  },

  // 监控消息发送
  monitorMessageSend: (socket, event, data) => {
    if (!socket) return;

    const startTime = Date.now();

    // 记录消息发送性能
    const { recordSocketOperation } = usePerformanceStore.getState();
    recordSocketOperation("message_send", 0, {
      socketId: socket.id,
      event,
      dataSize: JSON.stringify(data).length,
    });

    return { startTime };
  },

  // 监控消息接收
  monitorMessageReceive: (socket, event, startTime = null) => {
    if (!socket) return;

    const { recordSocketOperation } = usePerformanceStore.getState();

    // 如果有开始时间，计算往返时间
    if (startTime) {
      const duration = Date.now() - startTime;
      recordSocketOperation("message_roundtrip", duration, {
        socketId: socket.id,
        event,
      });
    }

    // 记录消息接收
    recordSocketOperation("message_receive", 0, {
      socketId: socket.id,
      event,
    });
  },
};

export default socketPerformanceMonitor;
