export {};
import type { RuntimeConfig } from './runtime-config';

declare global {
  interface Console {
    mail: (...args: unknown[]) => void;
  }

  interface NKGlobalConfig extends RuntimeConfig {}

  var NKGlobal: {
    config: NKGlobalConfig;
  };

  var NKRequire: <T = unknown>(namespace: string, file: string) => T | undefined;
  var $fixVal: <T = unknown>(originObj: object, newObjName: string, value: T) => void;
  var $request: new <T = unknown>(options: string | Record<string, unknown>) => Promise<T>;
}
