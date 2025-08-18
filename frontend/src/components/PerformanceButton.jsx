import { Activity } from "lucide-react";
import { usePerformanceStore } from "../store/usePerformanceStore";

const PerformanceButton = () => {
  const { isPanelVisible, togglePanel, analysis } = usePerformanceStore();

  // 根据性能分析结果确定按钮颜色
  const getButtonColor = () => {
    if (!analysis || !analysis.summary) return "text-primary";

    if (analysis.summary.hasPerformanceIssues) {
      return "text-red-500";
    }

    return "text-green-500";
  };

  return (
    <button
      onClick={togglePanel}
      className="flex items-center gap-1 tooltip tooltip-bottom"
      data-tip="性能监控"
    >
      <Activity className={`size-4 ${getButtonColor()}`} />
    </button>
  );
};

export default PerformanceButton;
