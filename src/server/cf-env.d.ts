/**
 * cloudflare:workers —— Workers 运行时注入的环境对象类型
 * （仅用于 tsc；运行时由 Workerd 提供，`import { env }` 即全局 env）
 */
declare module "cloudflare:workers" {
  export const env: {
    DB: unknown;
    AUTH_SECRET?: string;
    [key: string]: unknown;
  };
}
