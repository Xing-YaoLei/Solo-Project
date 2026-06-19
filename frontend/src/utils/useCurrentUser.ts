import { useEffect, useState } from 'react';
import api from './api';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

let cachedUser: CurrentUser | null = null;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser);
      return;
    }

    api.get('/auth/current-user')
      .then((data: any) => {
        cachedUser = data;
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  return user;
}
