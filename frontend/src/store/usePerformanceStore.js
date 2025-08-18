import { create } from "zustand";
import performanceMonitor, { METRIC_TYPES } from "../lib/performance";

// 创建性能监控状态管理
export const usePerformanceStore = create((set, get) => ({
  // 状态
  metrics: [],
  analysis: null,
  isPanelVisible: false,
  isMonitoring: false,

  // 初始化监控
  startMonitoring: () => {
    if (get().isMonitoring) return;

    performanceMonitor.start();
    performanceMonitor.onUpdate((metric, allMetrics) => {
      set({ metrics: [...allMetrics] });
    });

    set({ isMonitoring: true });

    // 记录初始页面加载性能
    performanceMonitor.recordPageLoad();
  },

  // 停止监控
  stopMonitoring: () => {
    if (!get().isMonitoring) return;

    performanceMonitor.stop();
    set({ isMonitoring: false });
  },

  // 清除性能数据
  clearMetrics: () => {
    performanceMonitor.clear();
    set({ metrics: [], analysis: null });
  },

  // 更新性能分析
  updateAnalysis: () => {
    const analysis = performanceMonitor.analyzePerformance();
    set({ analysis });
    return analysis;
  },

  // 记录API调用
  recordApiCall: (url, method, startTime, status, error = null) => {
    performanceMonitor.recordApiCall(url, method, startTime, status, error);
  },

  // 记录组件渲染
  recordComponentRender: (componentName, duration) => {
    performanceMonitor.recordComponentRender(componentName, duration);
  },

  // 记录Socket操作
  recordSocketOperation: (operation, duration, details = {}) => {
    performanceMonitor.recordSocketOperation(operation, duration, details);
  },

  // 切换面板可见性
  togglePanel: () => {
    const newVisibility = !get().isPanelVisible;
    set({ isPanelVisible: newVisibility });

    // 当面板显示时更新分析
    if (newVisibility) {
      get().updateAnalysis();
    }
  },

  // 获取特定类型的指标
  getMetricsByType: (type) => {
    return get().metrics.filter((metric) => metric.type === type);
  },

  // 获取页面性能指标
  getPageMetrics: () => {
    return get().getMetricsByType(METRIC_TYPES.PAGE);
  },

  // 获取API性能指标
  getApiMetrics: () => {
    return get().getMetricsByType(METRIC_TYPES.API);
  },

  // 获取组件性能指标
  getComponentMetrics: () => {
    return get().getMetricsByType(METRIC_TYPES.COMPONENT);
  },

  // 获取Socket性能指标
  getSocketMetrics: () => {
    return get().getMetricsByType(METRIC_TYPES.SOCKET);
  },
}));
