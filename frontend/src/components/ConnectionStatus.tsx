import { useAuthStore } from "../store/useAuthStore";
import { Wifi, WifiOff, Loader } from "lucide-react";

const ConnectionStatus = () => {
  const { connectionStatus } = useAuthStore();

  // 根据连接状态返回不同的图标和提示
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <div className="tooltip tooltip-bottom" data-tip="已连接">
            <Wifi className="size-4 text-green-500" />
          </div>
        );
      case "disconnected":
        return (
          <div className="tooltip tooltip-bottom" data-tip="已断开">
            <WifiOff className="size-4 text-red-500" />
          </div>
        );
      case "connecting":
        return (
          <div className="tooltip tooltip-bottom" data-tip="正在连接">
            <Loader className="size-4 text-yellow-500 animate-spin" />
          </div>
        );
      case "reconnecting":
        return (
          <div className="tooltip tooltip-bottom" data-tip="正在重连">
            <Loader className="size-4 text-yellow-500 animate-spin" />
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="flex items-center">{getStatusIcon()}</div>;
};

export default ConnectionStatus;
