import os
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dash import Dash
import dash_bootstrap_components as dbc

load_dotenv()

server = Flask(__name__)
server.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
server.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(server)

app = Dash(
    __name__,
    server=server,
    suppress_callback_exceptions=True,
    external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.FONT_AWESOME],
    title="职业教育在线课程漏斗报表"
)
