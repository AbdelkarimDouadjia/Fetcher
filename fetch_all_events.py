#!/usr/bin/env python3
"""Fetch all M2 AMIS events from CELCAT for the GitHub Pages tool."""

import json
from pathlib import Path

from web.celcat_client import CelcatClient

ROOT = Path(__file__).parent


def main():
    with (ROOT / "calendar-config.json").open(encoding="utf-8") as f:
        config = json.load(f)

    client = CelcatClient()
    client.initialize()
    events = client.get_calendar_data(
        config["federationIds"],
        config["startDate"],
        config["endDate"],
    )
    print(f"Fetched {len(events)} events")

    with (ROOT / "celcat-data.json").open("w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False)
    print("Saved to celcat-data.json")


if __name__ == "__main__":
    main()
