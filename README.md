# retried.ts

A minimal, type-safe asynchronous operation retry utility for TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why retired?

Retrying failed asynchronous operations (like network requests) is a common requirement. While libraries like
[`async-retry`](https://github.com/vercel/async-retry) existed already in this space, `retried.ts` aims to provide:

1.  **Simplicity:** The core logic is straightforward and contained within a single, small function.
2.  **Type Safety:** Built with TypeScript, providing clear interfaces and type checking out-of-the-box.
3.  **Modern Approach:** Uses modern `async/await` syntax.
4.  **Maintainability:** Addresses the fact that `async-retry` appears less actively maintained and lacks first-class
    TypeScript support.

## Copy, Don't Install

This library is intentionally simple. Instead of adding another dependency to your `package.json` for such a small
utility, **I strongly encourage you to copy the `src/retried.ts` code directly into your project.**

**Benefits:**

- **Zero Dependencies:** No extra baggage in your `node_modules`.
- **Full Control:** Easily understand, modify, and adapt the code to your specific needs without waiting for library
  updates.
- **Transparency:** You know exactly what code is running.
- **Reduced Complexity:** Avoids potential version conflicts or the overhead of managing another dependency.

Keep your codebase lean and maintain control over simple utilities like this!

## Usage

1.  **Copy:** Copy the contents of `src/retried.ts` (including the `RetryConfig` interface and the `retry` function) into your
    project (e.g., `src/utils/retried.ts`).
2.  **Import:** Import the `retry` function where needed.
3.  **Wrap:** Wrap your asynchronous function call with `retry`.

### Basic Example

```typescript
import { retry } from "./utils/retried"; // Adjust path as needed

async function mightFail(): Promise<string> {
    const random = Math.random();
    if (random < 0.7) {
        console.log("Operation failed, throwing error...");
        throw new Error("Failed to complete operation");
    }
    console.log("Operation succeeded!");
    return "Success!";
}

async function run() {
    try {
        const result = await retry(mightFail);
        console.log(`Final Result: ${result}`);
    } catch (error) {
        console.error(`Operation ultimately failed after retries: ${error}`);
    }
}

run();
```

### Example with Options

```typescript
import { retry } from "./utils/retried"; // Adjust path

async function fetchData(url: string): Promise<Response> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

async function getImportantData() {
    const retryOptions = {
        retries: 5, // Try 5 times total (1 initial + 4 retries)
        baseTimeout: 500, // Start with 500ms delay
        maxTimeout: 2 * 60 * 1000, // Stop once delay reaches 2 minutes
        strategy: "exponential", // Double the delay each time
        onRetry: (error) => {
            console.warn(`Attempt failed: ${error}. Retrying...`);
        },
    };

    try {
        const data = await retry(() => fetchData("https://api.example.com/data"), retryOptions);
        console.log("Successfully fetched data:", data);
    } catch (error) {
        console.error("Failed to fetch data after multiple retries:", error);
    }
}

getImportantData();
```

## Configuration Options (`RetryOptions`)

You can pass an optional configuration object as the second argument to `retry`.

| Option       | Type                                    | Default   | Description                                                                                      |
|--------------|-----------------------------------------|-----------|--------------------------------------------------------------------------------------------------|
| `retries`    | `number`                                | `3`       | Total number of attempts (initial attempt + retries).                                            |
| `baseTimeout`| `number`                                | `100`     | Initial delay in milliseconds before the first retry.                                           |
| `maxTimeout` | `number`                                | `300000`  | Maximum delay in milliseconds between retries.                                                   |
| `strategy`   | `'exponential'` \| `'fixed'`           | `exponential` | `'exponential'`: Doubles the timeout each retry. `'fixed'`: Keeps timeout constant.            |
| `onRetry`    | `(error: unknown) => void` \| `undefined` | `undefined` | Callback function executed _before_ each retry attempt (after a failure).                        |

_Note: The actual delay includes a small random jitter (0-1000ms by default) added to the calculated `timeout` to help prevent thundering herd issues._

## Testing

The retry function is designed to be testable. It accepts an optional third argument, delayFn, which defaults to a
function using setTimeout. You can provide a mock delay function (e.g., using vi.fn().mockResolvedValue(undefined) from
vitest) to test the retry logic without actual delays. See the accompanying test file (retry.test.ts if you copied it)
for examples.

## Acknowledgements

This utility is heavily inspired by the excellent [async-retry](https://github.com/vercel/async-retry) library by
Vercel. It aims to provide a similar core functionality with a focus on TypeScript and simplicity, encouraging direct
integration rather than dependency installation.

## License

MIT License - see the LICENSE file for details.
