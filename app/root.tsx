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

interface LoaderData {
  user: UserDocument | null;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const response = await fetch(`${new URL(request.url).origin}/api/auth/me`, {
      headers: {
        Cookie: request.headers.get("Cookie") || "",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return json<LoaderData>({ user: data.user });
    }
  } catch (e) {}
  return json<LoaderData>({ user: null });
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
