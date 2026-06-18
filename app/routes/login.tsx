import { useState } from "react";
import { Form, useActionData, redirect } from "@remix-run/react";
import { json, ActionFunction, LoaderFunction } from "@remix-run/node";
import { login, getUserFromSession } from "~/lib/auth.server";

interface ActionData {
  error?: string;
}

export const loader: LoaderFunction = async ({ context }) => {
  const user = await getUserFromSession(context as any);
  if (user) {
    return redirect("/dashboard");
  }
  return json({});
};

export const action: ActionFunction = async ({ request, context }) => {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return json<ActionData>({ error: "请输入用户名和密码" }, { status: 400 });
  }

  try {
    const user = await login(username, password, context as any);
    return redirect("/dashboard");
  } catch (e: any) {
    return json<ActionData>({ error: e.message }, { status: 401 });
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">🚗 二手车收购结算台</h1>
        <p className="login-subtitle">请登录以继续</p>

        {actionData?.error && (
          <div className="alert alert-error">{actionData.error}</div>
        )}

        <Form method="post" onSubmit={() => setIsLoading(true)}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="请输入用户名"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
            disabled={isLoading}
          >
            {isLoading ? "登录中..." : "登 录"}
          </button>
        </Form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
          <p>默认账号：</p>
          <p>管理员：admin / admin123</p>
          <p>执行员：executive / exec123</p>
        </div>
      </div>
    </div>
  );
}
