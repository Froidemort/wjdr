import reflex as rx

config = rx.Config(
    app_name="wjdr",
    app_module_import="src.wjdr.wjdr",
    plugins=[
        rx.plugins.SitemapPlugin(),
        rx.plugins.TailwindV4Plugin(),
    ],
)
