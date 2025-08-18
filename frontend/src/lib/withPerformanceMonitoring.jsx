import { useEffect, useRef } from "react";
import { usePerformanceStore } from "../store/usePerformanceStore";

// 性能监控高阶组件
const withPerformanceMonitoring = (Component, options = {}) => {
  // 获取组件名称
  const displayName =
    options.name ||
    Component.displayName ||
    Component.name ||
    "UnknownComponent";

  // 创建包装组件
  const WrappedComponent = (props) => {
    const { recordComponentRender } = usePerformanceStore();
    const renderStartTime = useRef(Date.now());

    // 在首次挂载后测量一次，避免因自身写入导致的无限重渲染
    useEffect(() => {
      const renderTime = Date.now() - renderStartTime.current;
      recordComponentRender(displayName, renderTime);
      // 仅在挂载时运行一次
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 渲染原始组件
    return <Component {...props} />;
  };

  // 设置组件名称
  WrappedComponent.displayName = `WithPerformanceMonitoring(${displayName})`;

  return WrappedComponent;
};

export default withPerformanceMonitoring;
