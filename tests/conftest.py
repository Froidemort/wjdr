import contextlib
import random

import pytest


# We use here the same seed value for all the tests
@pytest.fixture
@contextlib.contextmanager
def fixed_seed():
    state = random.getstate()
    random.seed(42)
    try:
        yield
    finally:
        random.setstate(state)
