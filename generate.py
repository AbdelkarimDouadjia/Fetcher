#!/usr/bin/env python3
"""
generate.py — Standalone calendar generator for GitHub Actions.

Reads calendar-config.json, fetches live data from CELCAT,
and writes calendar.ics to the repo root.
"""

import json, sys, os

# Allow importing from web/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "web"))

from celcat_client import CelcatClient
from event_filter import filter_events
from ics_generator import generate_ics


def main():
    config_path = os.path.join(os.path.dirname(__file__), "calendar-config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    start_date = cfg.get("startDate", "2026-09-21")
    end_date = cfg.get("endDate", "2027-10-31")
    programme = cfg.get("programmeSearchTerm", "M2 AMIS")
    fed_ids = cfg.get("federationIds", [])
    include_all = cfg.get("includeAllEvents", False)
    mod_list = cfg.get("modules", [])

    if not include_all and not mod_list:
        print("Error: No modules in calendar-config.json")
        sys.exit(1)

    # Build modules dict
    modules = {}
    for m in mod_list:
        code = m["code"].upper()
        grp = int(m.get("tdGroup", 1))
        modules[code] = {
            "name": m.get("name", code),
            "td_group": grp,
            "td_group_label": m.get("tdGroupLabel", f"{programme} grp {grp}"),
        }

    print("Modules: all" if include_all else f"Modules: {', '.join(modules.keys())}")
    print(f"Date range: {start_date} -> {end_date}")

    # Fetch groups from CELCAT
    client = CelcatClient()
    client.initialize()
    if not fed_ids:
        all_groups = client.search_groups(programme)
        fed_ids = [g["id"] for g in all_groups if g.get("id") == programme]

    if not fed_ids:
        print("Error: No matching CELCAT groups found")
        sys.exit(1)

    print(f"Fetching events from {len(fed_ids)} groups...")
    raw_events = client.get_calendar_data(fed_ids, start_date, end_date)
    print(f"Raw events: {len(raw_events)}")

    # Filter
    filtered = filter_events(
        raw_events,
        modules,
        include_exams=True,
        include_all=include_all,
    )
    print(f"Filtered events: {len(filtered)}")

    if not filtered:
        print("Warning: No events matched — writing empty calendar")

    # Generate .ics
    ics = generate_ics(filtered)
    out_path = os.path.join(os.path.dirname(__file__), "calendar.ics")
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        f.write(ics)

    print(f"Written to {out_path} ({len(ics)} bytes, {len(filtered)} events)")


if __name__ == "__main__":
    main()
