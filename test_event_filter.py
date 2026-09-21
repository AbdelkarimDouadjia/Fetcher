import unittest

from web.event_filter import filter_events


class IncludeAllEventsTest(unittest.TestCase):
    def test_keeps_module_and_non_module_events(self):
        raw = [
            {
                "id": "welcome",
                "start": "2026-09-21T15:30:00",
                "end": "2026-09-21T17:00:00",
                "eventCategory": "Rentrée solennelle",
                "description": "M2 AMIS [M2 AMIS]",
                "modules": None,
            },
            {
                "id": "class",
                "start": "2026-09-22T09:00:00",
                "end": "2026-09-22T10:30:00",
                "eventCategory": "TD",
                "description": "MYAMI213 - Programmation Avancée J2EE [MYAMI213]",
                "modules": ["MYAMI213 - Programmation Avancée J2EE"],
            },
        ]

        events = filter_events(raw, {}, include_all=True)

        self.assertEqual(2, len(events))
        self.assertEqual("Rentrée solennelle", events[0].summary)
        self.assertIn("MYAMI213", events[1].summary)


if __name__ == "__main__":
    unittest.main()
