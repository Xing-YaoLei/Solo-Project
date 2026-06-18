import { json, LoaderFunction, LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { UserDocument } from "~/models/user";
import { getUserFromSession, createDefaultUsers } from "~/lib/auth.server";

interface LoaderData {
  user: UserDocument | null;
}

export const loader: LoaderFunction = async ({ context }) => {
  try {
    await createDefaultUsers();
    const user = await getUserFromSession(context as any);
    return json<LoaderData>({ user: user ? (user.toJSON() as any) : null });
  } catch (e) {
    return json<LoaderData>({ user: null });
  }
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/styles.css" },
];

export default function App() {
  const data = useLoaderData<LoaderData>();

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>二手车收购结算台</title>
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
