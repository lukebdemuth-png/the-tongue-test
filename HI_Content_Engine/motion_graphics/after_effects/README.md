# HI Yoga Posture Reel Motion System

Reusable Adobe After Effects motion graphics template for 60-second Himalayan Institute posture reels.

Files:

- [BEGINNER_QUICKSTART.md](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/BEGINNER_QUICKSTART.md)
- [downward_dog_one_click_setup.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/downward_dog_one_click_setup.jsx)
- [downward_dog_ready_to_run.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/downward_dog_ready_to_run.jsx)
- [hi_yoga_posture_reel_template.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_template.jsx)
- [hi_yoga_posture_reel_easy_edit.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_easy_edit.jsx)

## What the script builds

- Vertical master comp: `1080x1920`, `60s`
- Example posture setup: `Downward Dog`
- Reusable precomps:
  - `THOUGHT_BUBBLE__TEMPLATE`
  - `GLOW_HIGHLIGHT__TEMPLATE`
  - `BREATH_CIRCLE__TEMPLATE`
  - `CLOSING_CTA__TEMPLATE`
  - `FULL_BODY_CONNECTION__TEMPLATE`
- Named control nulls for:
  - bubble positions
  - glow anchor positions
  - full-body connection points
- Face-safe guide layer to help keep overlays away from the practitioner’s face

## Design language

- Himalayan Institute orange: `#CF6F1A`
- Warm white / soft cream typography
- Thin elegant lines
- Soft glows, not neon
- Minimal editorial pacing
- Calm, sacred, cinematic tone

## How to use in After Effects

### Best option if you do not know After Effects

1. Open After Effects.
2. Go to `File > Scripts > Run Script File...`
3. Choose [downward_dog_one_click_setup.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/downward_dog_one_click_setup.jsx).
4. Pick your video clip when the file picker appears.
5. The script builds the reel and imports your footage automatically.
6. Open `DOWNWARD_DOG__MASTER` if it does not open by itself.
7. The script also adds the reel to the Render Queue and points the export to your Desktop.
8. In After Effects, open the `Render Queue` panel and click the `Render` button when you are happy with the result.

That is the new beginner path. You should not need to manually replace the footage placeholder when using this script.

### Easiest editable option

1. If you want the exact Downward Dog version with no edits, run [downward_dog_ready_to_run.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/downward_dog_ready_to_run.jsx).
2. If you want a simple editable version, open [hi_yoga_posture_reel_easy_edit.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_easy_edit.jsx).
3. Edit only the `EASY_EDIT` block at the top.
4. Run `File > Scripts > Run Script File...`
5. Open the generated master comp and swap the footage.

### Full template

1. Open [hi_yoga_posture_reel_easy_edit.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_easy_edit.jsx).
2. Edit only the `EASY_EDIT` block at the top.
3. Run `File > Scripts > Run Script File...`
4. Open the generated master comp and swap the footage.

1. Open After Effects.
2. Run `File > Scripts > Run Script File...`
3. Choose [hi_yoga_posture_reel_template.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_template.jsx).
4. Open `DOWNWARD_DOG__MASTER`.
5. Replace `REPLACE_WITH_POSTURE_FOOTAGE__KEEP_FACE_CLEAR` with your video.
6. Drag the `*_CTRL` null layers to reposition bubble anchors and glow targets.
7. If a glow needs to land on a different anatomical point for a new posture, move only the corresponding control null. You do not need to rebuild the animation logic.

## Most important editable layers

- `CUE_01__BUBBLE_CTRL` through `CUE_08__BUBBLE_CTRL`
- `GLOW_HANDS_CTRL`
- `GLOW_ARMS_CTRL`
- `GLOW_SHOULDERS_CTRL`
- `GLOW_SPINE_CTRL`
- `GLOW_HIPS_CTRL`
- `GLOW_LEGS_CTRL`
- `GLOW_HEELS_CTRL`
- `GLOW_NECK_CTRL`
- `FULL_BODY_HANDS_CTRL`
- `FULL_BODY_SPINE_CTRL`
- `FULL_BODY_HIPS_CTRL`
- `FULL_BODY_HEELS_CTRL`

## How to change posture cues

### Simple method

Use [hi_yoga_posture_reel_easy_edit.jsx](/Users/creative/Documents/New%20project/HI_Content_Engine/motion_graphics/after_effects/hi_yoga_posture_reel_easy_edit.jsx) and change only:

- `postureName`
- `compPrefix`
- `openingText`
- `exhaleText`
- `stayText`
- `ctaText`
- each cue `text`
- each cue `target`

Available cue targets:

- `HANDS`
- `ARMS`
- `SPINE`
- `HIPS`
- `LEGS`
- `HEELS`
- `NECK`
- `FULL_BODY`

### Advanced method

Open the `REEL_CONFIG` block at the top of the script.

Update:

- `postureName`
- `compName`
- `controlPoints`
- `bubbles`
- `centerMoments`
- `closingCta`

Each cue has:

- `start` and `end` times
- `text`
- `bubblePos`
- `targetCtrl`
- `glowTarget`
- `glowScale`

For the full-body cue, use:

- `fullBodyOverlay: true`

## Timeline included in the sample

- `0:00-0:05` opening breath circle and centered text
- `0:05-0:40` sequential posture cue bubbles with glow highlights
- `0:40-0:45` breath reset
- `0:45-0:50` full body connection cue
- `0:50-0:55` stay for 5 breaths
- `0:55-1:00` closing CTA

## Notes

- The script avoids placing elements over the face by using a guide layer, but final placement still depends on your footage framing.
- If you use the one-click script and something looks slightly off, the most likely fix is moving one of the `*_CTRL` null layers a small amount.
- Font selection uses `Gotham` if available and falls back to a clean sans-serif.
- The glow system is position-driven by manual control nulls so you can reuse the same motion behavior across different postures.
