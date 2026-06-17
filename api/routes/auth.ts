import { Router, type Request, type Response } from 'express';
import { mockUsers } from '../mock/data.js';
import type { ApiResponse, User, ShareLink } from '../../shared/types.js';

const router = Router();
const shareTokens = new Map<string, { user: User; expireAt: Date; dataScope: object }>();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    res.status(401).json({
      code: 401,
      message: '用户不存在',
    });
    return;
  }

  const response: ApiResponse<User> = {
    code: 200,
    data: user,
    message: '登录成功',
  };

  res.json(response);
});

router.post('/share', async (req: Request, res: Response): Promise<void> => {
  const { userId, expireDays = 7 } = req.body;
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    res.status(401).json({
      code: 401,
      message: '用户不存在',
    });
    return;
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

  const dataScope = {
    areas: user.role === 'area_manager' && user.area ? [user.area] : ['华东区', '华北区', '华南区'],
    roles: [user.role],
  };

  shareTokens.set(token, { user, expireAt, dataScope });

  const shareUrl = `/share/${token}`;

  const response: ApiResponse<ShareLink> = {
    code: 200,
    data: {
      shareUrl,
      token,
      expireAt: expireAt.toISOString(),
    },
    message: '分享链接生成成功',
  };

  res.json(response);
});

router.get('/share/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const shareData = shareTokens.get(token);

  if (!shareData) {
    res.status(404).json({
      code: 404,
      message: '分享链接不存在或已过期',
    });
    return;
  }

  if (new Date() > shareData.expireAt) {
    shareTokens.delete(token);
    res.status(404).json({
      code: 404,
      message: '分享链接已过期',
    });
    return;
  }

  const response: ApiResponse<{ user: User; dataScope: object }> = {
    code: 200,
    data: {
      user: shareData.user,
      dataScope: shareData.dataScope,
    },
    message: 'success',
  };

  res.json(response);
});

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  const response: ApiResponse<User[]> = {
    code: 200,
    data: mockUsers,
    message: 'success',
  };

  res.json(response);
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const response: ApiResponse<null> = {
    code: 200,
    data: null,
    message: '登出成功',
  };

  res.json(response);
});

export default router;
