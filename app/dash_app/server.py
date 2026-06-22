from flask import Flask, session, redirect, url_for, request, render_template_string
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

from app.config import Config
from app.database import SessionLocal
from app.services.sample_service import get_user_by_username

server = Flask(__name__)
server.config["SECRET_KEY"] = Config.SECRET_KEY

login_manager = LoginManager()
login_manager.init_app(server)
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id):
    db = SessionLocal()
    try:
        from app.services.sample_service import get_user_by_id
        return get_user_by_id(db, int(user_id))
    except Exception:
        return None
    finally:
        db.close()


LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>合规审计制度检查看板 - 登录</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .login-card { margin-top: 15vh; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-radius: 16px; }
    </style>
</head>
<body>
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-5">
            <div class="card login-card">
                <div class="card-body p-5">
                    <h3 class="card-title text-center mb-4">合规审计制度检查看板</h3>
                    <p class="text-muted text-center mb-4">Compliance Audit Dashboard</p>
                    {% if error %}
                    <div class="alert alert-danger" role="alert">{{ error }}</div>
                    {% endif %}
                    <form method="POST">
                        <div class="mb-3">
                            <label class="form-label">用户名</label>
                            <input type="text" name="username" class="form-control" required autofocus>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">密码</label>
                            <input type="password" name="password" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">登 录</button>
                    </form>
                    <div class="mt-4 small text-muted">
                        <p class="mb-1">测试账号：</p>
                        <p class="mb-0">管理员: admin / admin123</p>
                        <p class="mb-0">管理层: manager / manager123</p>
                        <p class="mb-0">一线审计: auditor1 / auditor123</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
"""


@server.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        db = SessionLocal()
        try:
            user = get_user_by_username(db, username)
            if user and user.check_password(password) and user.is_active:
                login_user(user)
                from datetime import datetime
                user.last_login = datetime.utcnow()
                db.commit()
                return redirect(url_for("/"))
            error = "用户名或密码错误"
        finally:
            db.close()
        return render_template_string(LOGIN_TEMPLATE, error=error)
    return render_template_string(LOGIN_TEMPLATE, error=None)


@server.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


@server.before_request
def require_login():
    if request.endpoint in ("login", "static"):
        return
    if not current_user.is_authenticated:
        return redirect(url_for("login"))
