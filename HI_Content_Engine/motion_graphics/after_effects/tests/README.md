# After Effects Script Test Ladder

Run these in order from simplest to more complex:

1. [01_alert_only.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/tests/01_alert_only.jsx)
2. [02_create_comp.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/tests/02_create_comp.jsx)
3. [03_create_text.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/tests/03_create_text.jsx)
4. [04_shape_and_null.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/tests/04_shape_and_null.jsx)

## What each result means

- If `01` fails:
  - After Effects is not executing scripts yet.
- If `01` works and `02` fails:
  - script execution works, but project/comp creation is blocked or erroring.
- If `02` works and `03` fails:
  - text layer creation is the failing step.
- If `03` works and `04` fails:
  - shape/null creation is the failing step.
- If all four work:
  - the larger template needs to be simplified or broken into smaller operations, but the core AE scripting environment is fine.

## What to tell me back

Reply with one line like:

`01 worked, 02 worked, 03 failed`

That’s enough for me to know the next fix.
