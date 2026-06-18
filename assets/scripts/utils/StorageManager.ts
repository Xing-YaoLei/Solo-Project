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
      if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
        cc.sys.localStorage.setItem(this._prefix + key, data);
      } else {
        localStorage.setItem(this._prefix + key, data);
      }
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  public load<T>(key: string, defaultValue: T): T {
    try {
      let data: string | null = null;
      if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
        data = cc.sys.localStorage.getItem(this._prefix + key);
      } else {
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
      if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
        cc.sys.localStorage.removeItem(this._prefix + key);
      } else {
        localStorage.removeItem(this._prefix + key);
      }
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  public clearAll(): void {
    try {
      if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
        const keys = [];
        for (let i = 0; i < cc.sys.localStorage.length; i++) {
          const key = cc.sys.localStorage.key(i);
          if (key && key.startsWith(this._prefix)) {
            keys.push(key);
          }
        }
        keys.forEach(k => cc.sys.localStorage.removeItem(k));
      } else {
        const keys = [];
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
