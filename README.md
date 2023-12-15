<h3 align="center">
  <img src="graphics/logo.png?raw=true" alt="Plattar Logo" width="600">
</h3>

[![NPM](https://img.shields.io/npm/v/@plattar/sdk-core)](https://www.npmjs.com/package/@plattar/sdk-core)

## About

Facilitating Seamless Integration with Plattar Backend Services through Automated TypeScript SDK Generation and Runtime Support

## Installation

-   Install using [npm](https://www.npmjs.com/package/@plattar/sdk-core)

```console
npm install @plattar/sdk-core
```

## Examples

Utilize the `@plattar/sample-sdk` example featuring `Scene`, `Application`, `Page` and `File` objects as references. Subsequently, substitute these samples with the corresponding objects from the SDK you are currently working with.

> [!IMPORTANT]   
> Kindly be aware that the objects employed in these illustrations may vary based on the generated SDK produced by this module.

### Service Configuration

Use `Service.config()` to set up a default global configuration that will be applied to all objects. Initialization options include unauthenticated, cookie authenticated, or token-based authentication.

#### Configuring Default Service without Authentication

```typescript
import { Service } from "@plattar/sample-sdk";

Service.config({
    url: 'https://api.plattar.com'
});
```

#### Configuring Default Service with Cookie Authentication

```typescript
import { Service } from "@plattar/sample-sdk";

Service.config({
    url: 'https://api.plattar.com',
    auth: {
        type: 'cookie'
    }
});
```

#### Configuring Default Service with Token Authentication

```typescript
import { Service } from "@plattar/sample-sdk";

Service.config({
    url: 'https://api.plattar.com',
    auth: {
        type: 'token',
        token: 'your-plattar-auth-token'
    }
});
```

### Handling Service Errors

The Service offers multiple error-handling configuration options. By default, errors are logged using `console.error()`. Your available options include:

- `silent`: Does not log or throw any errors and silently returns.
- `console.error`: Logs the error using `console.error()` and returns.
- `console.warn`: Logs the error using `console.warn()` and returns.
- `throw`: Throws the error, requiring you to catch it using a `try/catch` clause.

```typescript
import { Service } from "@plattar/sample-sdk";

Service.config({
    url: 'https://api.plattar.com',
    options: {
      errorHandler: 'silent'
    }
});
```

You have the option to supply your own error listener, which receives all errors irrespective of the errorHandler setting. This feature is beneficial for analytics or serving as a global catch-all. It is set to null by default.

```typescript
import { Service, CoreError } from "@plattar/sample-sdk";

Service.config({
    url: 'https://api.plattar.com',
    options: {
      errorHandler: 'silent',
      errorListener: (error:CoreError) => {
        console.error(error);
      }
    }
});
```

### Basic Object Queries

Employ the predefined objects to make API queries. Each SDK comes with its unique set of objects and query functions. Consult the documentation of the SDK you are using for detailed information.

#### Individual Object Query

Some queries exclusively yield a single object instance. In such cases, the result will either be the `object` or `null`.

```typescript
import { Scene } from "@plattar/sample-sdk";

const myScene:Scene | null = await new Scene("your-scene-id").query().get();
```

Alternatively, you have the option to execute the same query using the following approach

```typescript
import { Scene } from "@plattar/sample-sdk";

const myScene:Scene | null = await Scene.query().get({id: "your-scene-id" });
```

#### Multiple Object Query

Some queries result in multiple objects due to the query type. In these instances, the outcome will be an `array`.

```typescript
import { Scene } from "@plattar/sample-sdk";

const myScenes:Array<Scene> = await Scene("your-scene-id").query().list();
```

