import { axiosInstance } from "./axios";
import { usePerformanceStore } from "../store/usePerformanceStore";

// 设置Axios拦截器来监控API请求性能
export const setupAxiosInterceptors = () => {
  // 请求拦截器
  axiosInstance.interceptors.request.use(
    (config) => {
      // 添加请求开始时间
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  axiosInstance.interceptors.response.use(
    (response) => {
      const { startTime } = response.config.metadata;

      // 记录成功请求的性能数据
      if (startTime) {
        const { recordApiCall } = usePerformanceStore.getState();
        recordApiCall(
          response.config.url,
          response.config.method,
          startTime,
          response.status
        );
      }

      return response;
    },
    (error) => {
      if (error.config && error.config.metadata) {
        const { startTime } = error.config.metadata;

        // 记录失败请求的性能数据
        const { recordApiCall } = usePerformanceStore.getState();
        recordApiCall(
          error.config.url,
          error.config.method,
          startTime,
          error.response?.status,
          error
        );
      }

      return Promise.reject(error);
    }
  );
};
