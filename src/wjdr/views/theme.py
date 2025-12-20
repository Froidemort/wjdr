from __future__ import annotations

from contextlib import contextmanager

from nicegui import ui


def apply_theme() -> None:
    """Apply a custom theme to the application."""
    ui.colors(
        primary="#8C6A1F",  # burnished gold
        secondary="#4B5563",  # gunmetal
        accent="#5E35B1",  # arcane purple
        dark="#0B0C0E",  # smoky black
        dark_page="#130E00",  # deeper smoky black
        positive="#1B5E20",  # forest green
        negative="#B71C1C",  # blood red
        info="#1565C0",  # steel blue
        warning="#FF8F00",  # dark amber
    )


@contextmanager
def frame(navtitle: str, no_header: bool = False, no_footer: bool = False):
    """A context manager to create a framed layout with optional header and footer.

    Parameters
    ----------
    navtitle : str
        The title to display in the header.
    no_header : bool, optional
        If True, the header will not be displayed. Default is False.
    no_footer : bool, optional
        If True, the footer will not be displayed. Default is False.
    """
    apply_theme()
    with ui.column().classes("absolute-center items-center h-screen no-wrap p-9 w-full"):
        yield
    if not no_header:
        with ui.header().classes("items-center justify-between"):
            ui.label(navtitle).classes("text-lg font-bold")
            ui.button("Home").on("click", lambda: ui.navigate.to("/")).classes("primary")
    if not no_footer:
        with ui.footer(fixed=True).classes("justify-center text-sm"):
            ui.label("PHILIPPE Jean-Baptiste © 2025")
