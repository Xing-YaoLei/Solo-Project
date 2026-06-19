import { writable } from 'svelte/store';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  region?: string | null;
  createdAt: Date;
}

export const userStore = writable<User | null>(null);
