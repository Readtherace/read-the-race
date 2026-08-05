#!/bin/sh
# Pre-commit safeguard: blocks a commit if any staged horse/greyhound entry
# records its price as unavailable at commitment.
#
# What this can and can't do: this script only sees staged repo files. It
# has no way to know whether the original source racecard actually carried
# a betting forecast or per-runner price — that text is never stored in the
# repo. So it cannot verify "the source had a price and we missed it" on
# its own. What it CAN do is stop any commit from going through silently
# when an entry says its price was unavailable, forcing whoever is
# committing to consciously re-check the source and either populate the
# price or deliberately override.
#
# To override (only after actually re-checking the source has no price):
#   ALLOW_MISSING_PRICE=1 git commit ...

MARKER="Not available in the source data at commitment"

if [ "$ALLOW_MISSING_PRICE" = "1" ]; then
  exit 0
fi

staged_entries=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^(horses|greyhounds)/entries/.*\.md$')

if [ -z "$staged_entries" ]; then
  exit 0
fi

found=""
for f in $staged_entries; do
  if [ -f "$f" ] && grep -q "$MARKER" "$f"; then
    found="$found\n  $f"
  fi
done

if [ -n "$found" ]; then
  printf '\nCommit blocked: the following staged entries record no price at commitment:\n%b\n\n' "$found"
  printf 'Before overriding, re-check the source racecard for a betting forecast or\n'
  printf 'per-runner price you may have missed. If the price genuinely was not in\n'
  printf 'the source, override with:\n\n  ALLOW_MISSING_PRICE=1 git commit ...\n\n'
  exit 1
fi

exit 0
