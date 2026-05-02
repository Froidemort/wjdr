import reflex as rx

config = rx.Config(
    app_name="wjdr",
    app_module_import="src.wjdr.wjdr",
    api_url="http://localhost:8080",
    deploy_url="http://localhost:8080",
    backend_host="::",
    cors_allowed_origins=["http://localhost:8080", "http://localhost:3000"],
    db_url="postgresql+psycopg://postgres:postgres@localhost:5432/wjdr",
    plugins=[
        rx.plugins.SitemapPlugin(),
        rx.plugins.TailwindV4Plugin(),
    ],
)
