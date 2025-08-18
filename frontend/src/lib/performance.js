// 性能监控工具 - 轻量级实现

// 性能指标类型
const METRIC_TYPES = {
  PAGE: "page", // 页面性能
  API: "api", // API请求性能
  COMPONENT: "component", // 组件渲染性能
  SOCKET: "socket", // Socket连接性能
};

// 创建性能监控单例
const createPerformanceMonitor = () => {
  // 私有变量
  let metrics = [];
  let isMonitoring = false;
  let onUpdateCallback = null;
  let paintObserver = null;
  let fcpRecorded = false;

  // 添加性能指标
  const addMetric = (type, name, value, details = {}) => {
    if (!isMonitoring) return;

    const metric = {
      type,
      name,
      value,
      timestamp: Date.now(),
      ...details,
    };

    metrics.push(metric);

    // 限制存储数量，避免内存泄漏
    if (metrics.length > 100) {
      metrics = metrics.slice(-100);
    }

    // 触发回调
    if (onUpdateCallback) {
      onUpdateCallback(metric, metrics);
    }

    return metric;
  };

  // 公开API
  return {
    // 启动监控
    start() {
      if (isMonitoring) return;
      isMonitoring = true;
      console.log("Performance monitoring started");

      // 监听 paint 事件，确保能捕获到 FCP（包括 buffered 历史条目）
      try {
        if (typeof PerformanceObserver !== "undefined") {
          paintObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!fcpRecorded && entry.name === "first-contentful-paint") {
                fcpRecorded = true;
                addMetric(METRIC_TYPES.PAGE, "fcp", entry.startTime, {
                  url: window.location.pathname,
                });
              } else if (!fcpRecorded && entry.name === "first-paint") {
                // Fallback: 使用 FP 作为近似的 FCP
                fcpRecorded = true;
                addMetric(METRIC_TYPES.PAGE, "fcp", entry.startTime, {
                  url: window.location.pathname,
                  fallback: "fp",
                });
              }
            }
          });
          // buffered: true 以读取在 observer 注册之前产生的条目
          paintObserver.observe({ type: "paint", buffered: true });
        }
      } catch {}
    },

    // 停止监控
    stop() {
      if (!isMonitoring) return;
      isMonitoring = false;
      console.log("Performance monitoring stopped");

      try {
        if (paintObserver && typeof paintObserver.disconnect === "function") {
          paintObserver.disconnect();
          paintObserver = null;
        }
      } catch {}
    },

    // 清除所有指标
    clear() {
      metrics = [];
    },

    // 获取所有指标
    getMetrics() {
      return [...metrics];
    },

    // 获取特定类型的指标
    getMetricsByType(type) {
      return metrics.filter((m) => m.type === type);
    },

    // 设置更新回调
    onUpdate(callback) {
      onUpdateCallback = callback;
    },

    // 记录页面加载性能
    recordPageLoad() {
      if (!isMonitoring || !window.performance) return;

      try {
        const navigationTiming = performance.getEntriesByType("navigation")[0];
        if (navigationTiming) {
          // 页面加载总时间
          addMetric(
            METRIC_TYPES.PAGE,
            "load",
            navigationTiming.loadEventEnd - navigationTiming.startTime,
            { url: window.location.pathname }
          );

          // 首次内容绘制时间
          const paintEntries = performance.getEntriesByType("paint");
          const fcpEntry = paintEntries.find(
            (entry) => entry.name === "first-contentful-paint"
          );
          if (fcpEntry && !fcpRecorded) {
            fcpRecorded = true;
            addMetric(METRIC_TYPES.PAGE, "fcp", fcpEntry.startTime, {
              url: window.location.pathname,
            });
          } else if (!fcpRecorded) {
            const fpEntry = paintEntries.find(
              (entry) => entry.name === "first-paint"
            );
            if (fpEntry) {
              fcpRecorded = true;
              addMetric(METRIC_TYPES.PAGE, "fcp", fpEntry.startTime, {
                url: window.location.pathname,
                fallback: "fp",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error recording page load metrics:", error);
      }
    },

    // 记录API请求性能
    recordApiCall(url, method, startTime, status, error = null) {
      if (!isMonitoring) return;

      const duration = Date.now() - startTime;
      addMetric(METRIC_TYPES.API, error ? "api_error" : "api_call", duration, {
        url,
        method,
        status,
        error: error?.message,
      });
    },

    // 记录组件渲染性能
    recordComponentRender(componentName, duration) {
      if (!isMonitoring) return;

      // 简单去重/节流：若同名组件在1秒内重复上报，只保留首条（开发模式严格模式双挂载会触发）
      if (!this._lastComponentRecordAt) this._lastComponentRecordAt = {};
      const now = Date.now();
      const lastAt = this._lastComponentRecordAt[componentName] || 0;
      if (now - lastAt < 1000) return;
      this._lastComponentRecordAt[componentName] = now;

      addMetric(METRIC_TYPES.COMPONENT, componentName, duration);
    },

    // 记录Socket连接性能
    recordSocketOperation(operation, duration, details = {}) {
      if (!isMonitoring) return;

      addMetric(METRIC_TYPES.SOCKET, operation, duration, details);
    },

    // 简单分析性能数据
    analyzePerformance() {
      const pageMetrics = this.getMetricsByType(METRIC_TYPES.PAGE);
      const apiMetrics = this.getMetricsByType(METRIC_TYPES.API);
      const componentMetrics = this.getMetricsByType(METRIC_TYPES.COMPONENT);
      const socketMetrics = this.getMetricsByType(METRIC_TYPES.SOCKET);

      // 计算平均值
      const calculateAverage = (items) => {
        if (!items.length) return null;
        return items.reduce((sum, item) => sum + item.value, 0) / items.length;
      };

      // 找出最慢的项目
      const findSlowest = (items, count = 3) => {
        return [...items].sort((a, b) => b.value - a.value).slice(0, count);
      };

      // 计算错误率
      const calculateErrorRate = (items, errorType) => {
        if (!items.length) return 0;
        const errors = items.filter((item) => item.name.includes(errorType));
        return errors.length / items.length;
      };

      return {
        page: {
          averageLoadTime: calculateAverage(
            pageMetrics.filter((m) => m.name === "load")
          ),
          averageFCP: calculateAverage(
            pageMetrics.filter((m) => m.name === "fcp")
          ),
        },
        api: {
          averageResponseTime: calculateAverage(
            apiMetrics.filter((m) => !m.name.includes("error"))
          ),
          errorRate: calculateErrorRate(apiMetrics, "error"),
          slowestRequests: findSlowest(
            apiMetrics.filter((m) => !m.name.includes("error"))
          ),
        },
        component: {
          // 聚合同名组件，展示平均渲染时长，避免重复项
          slowestComponents: (() => {
            const groups = {};
            componentMetrics.forEach((m) => {
              if (!groups[m.name]) groups[m.name] = [];
              groups[m.name].push(m.value);
            });
            const list = Object.entries(groups).map(([name, arr]) => ({
              name,
              renderTime: arr.reduce((s, v) => s + v, 0) / (arr.length || 1),
            }));
            return list.sort((a, b) => b.renderTime - a.renderTime).slice(0, 5);
          })(),
        },
        socket: {
          connectionTime: calculateAverage(
            socketMetrics.filter((m) => m.name === "connect")
          ),
          disconnectionCount: socketMetrics.filter(
            (m) => m.name === "disconnect"
          ).length,
        },
        summary: {
          totalMetricsCount: metrics.length,
          hasPerformanceIssues: this.hasPerformanceIssues(),
        },
      };
    },

    // 检测性能问题
    hasPerformanceIssues() {
      const pageMetrics = this.getMetricsByType(METRIC_TYPES.PAGE);
      const apiMetrics = this.getMetricsByType(METRIC_TYPES.API);
      const componentMetrics = this.getMetricsByType(METRIC_TYPES.COMPONENT);

      // 页面加载时间超过3秒
      const hasSlowPageLoad = pageMetrics
        .filter((m) => m.name === "load")
        .some((m) => m.value > 3000);

      // API错误率超过5%
      const apiErrorRate =
        apiMetrics.length > 0
          ? apiMetrics.filter((m) => m.name.includes("error")).length /
            apiMetrics.length
          : 0;
      const hasHighApiErrorRate = apiErrorRate > 0.05;

      // 存在渲染时间超过500ms的组件
      const hasSlowComponent = componentMetrics.some((m) => m.value > 500);

      return hasSlowPageLoad || hasHighApiErrorRate || hasSlowComponent;
    },
  };
};

// 导出单例
const performanceMonitor = createPerformanceMonitor();
export default performanceMonitor;
export { METRIC_TYPES };
