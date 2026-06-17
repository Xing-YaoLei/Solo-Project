import dash
import dash_bootstrap_components as dbc
from flask import Flask
from werkzeug.security import generate_password_hash

from app.config import config
from app.database import init_db, get_session
from app.models import User, UserScope
from app.dash_app.layouts import login_manager, create_login_layout, create_main_layout
from app.dash_app.callbacks import register_callbacks


def ensure_default_users():
    with get_session() as session:
        admin = session.query(User).filter(User.username == 'admin').first()
        if not admin:
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin123'),
                real_name='系统管理员',
                role='admin',
                email='admin@example.com',
                phone='13800000000',
                is_active=True,
            )
            session.add(admin)
            session.flush()
            session.add(UserScope(user_id=admin.id, scope_type='project', scope_value='*'))
            session.add(UserScope(user_id=admin.id, scope_type='district', scope_value='*'))

        front = session.query(User).filter(User.username == 'frontline').first()
        if not front:
            front = User(
                username='frontline',
                password_hash=generate_password_hash('front123'),
                real_name='一线管家小张',
                role='frontline',
                email='zhang@example.com',
                phone='13900000001',
                is_active=True,
            )
            session.add(front)
            session.flush()
            session.add(UserScope(user_id=front.id, scope_type='project', scope_value='阳光花园'))
            session.add(UserScope(user_id=front.id, scope_type='project', scope_value='水岸豪庭'))

        session.commit()


def create_app():
    init_db()
    ensure_default_users()

    server = Flask(__name__)
    server.config['SECRET_KEY'] = config.SECRET_KEY

    login_manager.init_app(server)
    login_manager.login_view = '/'

    app = dash.Dash(
        __name__,
        server=server,
        external_stylesheets=[
            dbc.themes.FLATLY,
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
        ],
        suppress_callback_exceptions=True,
        title='长租公寓房源上架漏斗报表',
        meta_tags=[
            {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'},
        ],
    )

    app.layout = dbc.Container([
        dash.dcc.Location(id='url', refresh=False),
        dash.html.Div(id='page-content'),
    ], fluid=True, style={'margin': 0, 'padding': 0})

    register_callbacks(app)

    return app, server


app, server = create_app()


if __name__ == '__main__':
    app.run(debug=config.DEBUG, host='0.0.0.0', port=8050)
