import { redirect, LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { api } from "~/lib/api";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const data = await api.auth.me();
    if (data.user) {
      return redirect("/dashboard");
    }
  } catch (e) {}
  return redirect("/login");
};

export default function Index() {
  return null;
}
