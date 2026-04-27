"""Welcome to Reflex! This file outlines the steps to create a basic app."""

import reflex as rx

from rxconfig import config  # noqa: F401


class IndexState(rx.State):
    """The app state."""


def create_campaign() -> rx.Component:
    # Create Campaign Page
    return rx.container(
        rx.heading("Create a new campaign", size="9"),
        rx.text("This is the create campaign page.", size="5"),
        spacing="5",
        justify="center",
        min_height="85vh",
    )


def about() -> rx.Component:
    # About Page
    return rx.container(
        rx.heading("About WJDR game master helper", size="9"),
        rx.text("This is the about page of the app.", size="5"),
        spacing="5",
        justify="center",
        min_height="85vh",
    )


def index() -> rx.Component:
    # Welcome Page (Index)
    return rx.container(
        rx.color_mode.button(position="top-right"),
        rx.vstack(
            rx.heading("Assistant de WJDR, 2ème édition", size="9"),
            rx.link(
                rx.button("Créer une campagne"),
                href="/create-campaign",
            ),
            rx.link(
                rx.button("Créer un personnage"),
                href="/create-character",
            ),
            rx.link(
                rx.button("Créer une carrière"),
                href="/create-career",
            ),
            spacing="5",
            justify="center",
            min_height="85vh",
        ),
    )


app = rx.App()
app.add_page(index)
app.add_page(about)
app.add_page(create_campaign)
