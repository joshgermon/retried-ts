import { test, expect, describe, vi, beforeEach } from "vitest";
import { retry } from "../index";

describe("retry", () => {
    const mockDelay = vi.fn(() => Promise.resolve());

    beforeEach(() => {
        mockDelay.mockClear();
    });

    test("async function success returns immediately", async () => {
        const testFn = vi.fn().mockResolvedValue("success");
        // Use default configuration
        const result = await retry(testFn, undefined, mockDelay);
        expect(result).toBe("success");
    });

    test("async function is retried and eventually succeeds", async () => {
        let retries = 3;
        const testFn = vi
            .fn()
            .mockRejectedValueOnce("error")
            .mockRejectedValueOnce("error")
            .mockResolvedValue("success");

        const result = await retry(testFn, { retries }, mockDelay);
        expect(mockDelay).toBeCalledTimes(2);
        expect(testFn).toBeCalledTimes(3);
        expect(result).toBe("success");
    });

    test("async function is retried and eventually fails with error", async () => {
        let retries = 3;
        const testFn = vi.fn().mockRejectedValue("error");

        await expect(retry(testFn, { retries }, mockDelay)).rejects.toThrow("error");
        expect(testFn).toHaveBeenCalledTimes(retries);
    });

    test("onRetry function is called between attempts", async () => {
        const onRetry = vi.fn();
        const testFn = vi.fn().mockRejectedValue("error");

        await expect(retry(testFn, { onRetry }, mockDelay)).rejects.toThrow("error");
        expect(onRetry).toHaveBeenCalled();
    });

    test("error is returned if max timeout is reached with exponential strategy", async () => {
        const testFn = vi.fn().mockRejectedValue("error");
        const config = {
            retries: 50, // Max timeout will be reached first
            strategy: "exponential",
            baseTimeout: 1000,
            maxTimeout: 8000,
        } as const;
        await expect(retry(testFn, config, mockDelay)).rejects.toThrow("error");

        expect(mockDelay).toHaveBeenNthCalledWith(1, 1000);
        expect(mockDelay).toHaveBeenNthCalledWith(2, 2000);
        expect(mockDelay).toHaveBeenNthCalledWith(3, 4000);

        // Max timeout of 8000 reached, will not be called again
        expect(testFn).toHaveBeenCalledTimes(4); // 0 -> 1000 -> 2000 -> 4000 -> 8000 (Max) stop
    });
});
