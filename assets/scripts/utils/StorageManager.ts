import { sys } from 'cc';

export class StorageManager {
  private static _instance: StorageManager | null = null;
  private _prefix = 'hd_sim_';

  public static get instance(): StorageManager {
    if (!this._instance) {
      this._instance = new StorageManager();
    }
    return this._instance;
  }

  public save(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      if (sys && sys.localStorage) {
        sys.localStorage.setItem(this._prefix + key, data);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this._prefix + key, data);
      }
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  public load<T>(key: string, defaultValue: T): T {
    try {
      let data: string | null = null;
      if (sys && sys.localStorage) {
        data = sys.localStorage.getItem(this._prefix + key);
      } else if (typeof localStorage !== 'undefined') {
        data = localStorage.getItem(this._prefix + key);
      }
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (e) {
      console.error('Storage load error:', e);
    }
    return defaultValue;
  }

  public remove(key: string): void {
    try {
      if (sys && sys.localStorage) {
        sys.localStorage.removeItem(this._prefix + key);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this._prefix + key);
      }
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  public clearAll(): void {
    try {
      if (sys && sys.localStorage) {
        const keys: string[] = [];
        const storage = sys.localStorage;
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(this._prefix)) {
            keys.push(key);
          }
        }
        keys.forEach(k => sys.localStorage!.removeItem(k));
      } else if (typeof localStorage !== 'undefined') {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this._prefix)) {
            keys.push(key);
          }
        }
        keys.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }
}
