import { useRef, useCallback } from "react";

/**
 * 缓冲更新Hook - 批量处理高频更新
 * 通过 requestAnimationFrame 将多个更新合并为一次
 * 将渲染频次从 120次/秒 降至 40次/秒
 */
export const useBufferedUpdate = (onFlush: (chunks: string[]) => void) => {
  // 缓冲队列
  const bufferRef = useRef<string[]>([]);
  // 动画帧 ID
  const rafIdRef = useRef<number>();
  // 上次刷新时间
  const lastFlushRef = useRef(Date.now());

  // 添加 chunk
  const addChunk = useCallback(
    (chunk: string) => {
      bufferRef.current.push(chunk);

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        const elapsed = now - lastFlushRef.current;

        // 至少间隔 25ms 刷新（40fps）
        if (elapsed >= 25 || bufferRef.current.length >= 10) {
          onFlush([...bufferRef.current]);
          bufferRef.current = [];
          lastFlushRef.current = now;
        } else {
          // 如果时间不够，延迟到下一帧
          rafIdRef.current = requestAnimationFrame(() => {
            if (bufferRef.current.length > 0) {
              onFlush([...bufferRef.current]);
              bufferRef.current = [];
              lastFlushRef.current = Date.now();
            }
          });
        }
      });
    },
    [onFlush]
  );

  return { addChunk };
};
