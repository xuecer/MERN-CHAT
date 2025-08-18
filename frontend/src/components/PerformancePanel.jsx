import { useState, useEffect } from "react";
import { usePerformanceStore } from "../store/usePerformanceStore";
import { X, Activity, Clock, Zap, Globe } from "lucide-react";

const PerformancePanel = () => {
  const { metrics, analysis, isPanelVisible, togglePanel, updateAnalysis } =
    usePerformanceStore();
  const [activeTab, setActiveTab] = useState("page");

  // 定期更新分析
  useEffect(() => {
    if (isPanelVisible) {
      updateAnalysis();
      const interval = setInterval(updateAnalysis, 5000); // 每5秒更新一次
      return () => clearInterval(interval);
    }
  }, [isPanelVisible, updateAnalysis]);

  if (!isPanelVisible) return null;

  // 格式化时间
  const formatTime = (ms) => {
    if (ms === undefined || ms === null) return "N/A";
    return ms.toFixed(0) + " ms";
  };

  // 获取状态颜色
  const getStatusColor = (value, thresholds) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return "text-gray-500";
    }
    if (value < thresholds.good) return "text-green-500";
    if (value < thresholds.warning) return "text-yellow-500";
    return "text-red-500";
  };

  // 渲染页面性能
  const renderPageMetrics = () => {
    if (!analysis?.page)
      return <div className="text-sm text-gray-500">暂无页面性能数据</div>;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">页面加载时间</span>
          <span
            className={`text-sm font-medium ${getStatusColor(
              analysis.page.averageLoadTime,
              { good: 1000, warning: 3000 }
            )}`}
          >
            {formatTime(analysis.page.averageLoadTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">首次内容绘制 (FCP)</span>
          <span
            className={`text-sm font-medium ${getStatusColor(
              analysis.page.averageFCP,
              { good: 1000, warning: 2000 }
            )}`}
          >
            {formatTime(analysis.page.averageFCP)}
          </span>
        </div>
      </div>
    );
  };

  // 渲染API性能
  const renderApiMetrics = () => {
    if (!analysis?.api)
      return <div className="text-sm text-gray-500">暂无API性能数据</div>;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">平均响应时间</span>
          <span
            className={`text-sm font-medium ${getStatusColor(
              analysis.api.averageResponseTime,
              { good: 200, warning: 500 }
            )}`}
          >
            {formatTime(analysis.api.averageResponseTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">错误率</span>
          <span
            className={`text-sm font-medium ${
              analysis.api.errorRate > 0.05 ? "text-red-500" : "text-green-500"
            }`}
          >
            {(analysis.api.errorRate * 100).toFixed(1)}%
          </span>
        </div>

        {analysis.api.slowestRequests?.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs text-gray-500 mb-1">最慢的请求</h5>
            {analysis.api.slowestRequests.map((req, index) => (
              <div
                key={index}
                className="text-xs border-l-2 border-primary pl-2 py-1 mb-1"
              >
                <div
                  className="font-medium truncate"
                  style={{ maxWidth: "220px" }}
                >
                  {req.url}
                </div>
                <div className="flex justify-between">
                  <span>{req.method}</span>
                  <span
                    className={getStatusColor(req.value, {
                      good: 200,
                      warning: 500,
                    })}
                  >
                    {formatTime(req.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染组件性能
  const renderComponentMetrics = () => {
    if (!analysis?.component?.slowestComponents?.length) {
      return <div className="text-sm text-gray-500">暂无组件性能数据</div>;
    }

    return (
      <div className="space-y-2">
        {analysis.component.slowestComponents.map((comp, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm truncate max-w-[180px]">{comp.name}</span>
            <span
              className={`text-sm font-medium ${getStatusColor(
                comp.renderTime,
                { good: 100, warning: 300 }
              )}`}
            >
              {formatTime(comp.renderTime)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 渲染Socket性能
  const renderSocketMetrics = () => {
    if (!analysis?.socket)
      return <div className="text-sm text-gray-500">暂无Socket性能数据</div>;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">平均连接时间</span>
          <span
            className={`text-sm font-medium ${getStatusColor(
              analysis.socket.connectionTime,
              { good: 100, warning: 300 }
            )}`}
          >
            {formatTime(analysis.socket.connectionTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">断开连接次数</span>
          <span
            className={`text-sm font-medium ${
              analysis.socket.disconnectionCount > 3
                ? "text-red-500"
                : "text-green-500"
            }`}
          >
            {analysis.socket.disconnectionCount || 0}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-80 bg-base-100 border-t border-l border-base-300 shadow-lg z-50 max-h-[70vh] overflow-auto">
      <div className="flex items-center justify-between p-3 border-b border-base-300">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h3 className="font-medium">性能监控</h3>
        </div>
        <button
          onClick={togglePanel}
          className="btn btn-sm btn-ghost btn-circle"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 标签栏 */}
      <div className="flex border-b border-base-300">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "page" ? "border-b-2 border-primary" : ""
          }`}
          onClick={() => setActiveTab("page")}
        >
          页面
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "api" ? "border-b-2 border-primary" : ""
          }`}
          onClick={() => setActiveTab("api")}
        >
          API
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "component" ? "border-b-2 border-primary" : ""
          }`}
          onClick={() => setActiveTab("component")}
        >
          组件
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "socket" ? "border-b-2 border-primary" : ""
          }`}
          onClick={() => setActiveTab("socket")}
        >
          Socket
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-3">
        {activeTab === "page" && (
          <div className="flex items-center gap-2 mb-3">
            <Globe className="size-4 text-primary" />
            <h4 className="font-medium">页面性能</h4>
          </div>
        )}
        {activeTab === "api" && (
          <div className="flex items-center gap-2 mb-3">
            <Zap className="size-4 text-primary" />
            <h4 className="font-medium">API性能</h4>
          </div>
        )}
        {activeTab === "component" && (
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-primary" />
            <h4 className="font-medium">组件性能</h4>
          </div>
        )}
        {activeTab === "socket" && (
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" />
            <h4 className="font-medium">Socket性能</h4>
          </div>
        )}

        {activeTab === "page" && renderPageMetrics()}
        {activeTab === "api" && renderApiMetrics()}
        {activeTab === "component" && renderComponentMetrics()}
        {activeTab === "socket" && renderSocketMetrics()}

        <div className="text-xs text-gray-500 mt-4">
          已收集 {metrics.length} 条性能数据
        </div>
      </div>
    </div>
  );
};

export default PerformancePanel;
