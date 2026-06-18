/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import type { UserDocument } from "~/models/user";
import type { Session } from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare module "@remix-run/node" {
  interface Session {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
