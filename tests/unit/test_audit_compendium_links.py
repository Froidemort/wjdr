"""Tests for the read-only local compendium audit."""

import unittest

from scripts.data.audit_compendium_links import normalize, read_seed


class AuditCompendiumLinksTests(unittest.TestCase):
    """Check normalization and failure on missing input."""

    def test_normalizes_accents_and_extraction_exceptions(self) -> None:
        """Normalize accents and the documented PDF abbreviation."""
        self.assertEqual(normalize("Connaissan. piège"), "connaissances des pieges")
        self.assertEqual(normalize("Équitation"), "equitation")

    def test_missing_seed_fails_explicitly(self) -> None:
        """Missing seed statements must not appear as an empty inventory."""
        with self.assertRaisesRegex(ValueError, "Missing seed"):
            read_seed("")


if __name__ == "__main__":
    unittest.main()
