export abstract class Singleton<T> {
  private static _instance: unknown;

  protected constructor() {}

  static getInstance<T>(this: new () => T): T {
    if (!Singleton._instance) {
      Singleton._instance = new this();
    }
    return Singleton._instance as T;
  }

  static destroyInstance(): void {
    Singleton._instance = null;
  }
}
