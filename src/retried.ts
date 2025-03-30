type RetriedConfig = {
  retries: number;
  strategy: "exponential" | "fixed";
  baseTimeout: number;
  maxTimeout: number;
  onRetry?: (error: unknown) => void;
};

export type RetriedOptions = Partial<RetriedConfig>;

const DEFAULT_JITTER_MAX = 1000;
const DEFAULT_CONFIG: RetriedConfig = {
  retries: 3,
  strategy: "exponential",
  baseTimeout: 1000,
  maxTimeout: 5 * 60 * 1000, // 5 Minutes
} as const;

const defaultDelay = (timeout: number, jitterMax: number = DEFAULT_JITTER_MAX) => {
  const delay = timeout + Math.floor(Math.random() * jitterMax);
  return new Promise((res) => setTimeout(res, delay));
};

type DelayFn = typeof defaultDelay;

export async function retry<T>(
  fn: () => Promise<T>,
  opts?: RetriedOptions,
  delayFn: DelayFn = defaultDelay,
): Promise<T> {
  const config: RetriedConfig = {
    ...DEFAULT_CONFIG,
    ...opts,
    onRetry: opts?.onRetry,
  };

  let currentAttempt = 1; // Initial attempt
  let thrownError: unknown = null;
  let timeout = config.baseTimeout;

  while (currentAttempt <= config.retries) {
    try {
      console.debug(`Attempting retry ${currentAttempt}`);
      return await fn();
    } catch (error) {
      thrownError = error;
      currentAttempt++;

      // Re-throw error if we haved exceeded retry attempts or max timeout
      if (currentAttempt > config.retries) {
        console.debug("Reached maximum retries, request failed");
        throw error;
      } else if (timeout >= config.maxTimeout) {
        console.debug("Reached maximum timeout, request failed");
        throw error;
      }

      // Delay before retry
      await delayFn(timeout);

      // Increase next timeout if strategy is exponential
      if (config.strategy === "exponential") {
        timeout *= 2;
      }

      // Call onRetry call back before retrying
      if (config.onRetry) config.onRetry(thrownError);
    }
  }

  // This is unreachable
  throw Error("Reached maximum retries");
}
