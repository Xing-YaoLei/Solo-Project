import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  
  if (!user && url.pathname !== '/login') {
    throw redirect(302, '/login');
  }
  
  if (user && url.pathname === '/login') {
    throw redirect(302, '/');
  }

  return {
    user
  };
};
