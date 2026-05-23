# Premiere Build Steps

## Build One Cue

1. Put your yoga footage on `V1`.
2. Add `glow_soft_ring.svg` on `V2`.
3. Add `glow_point_dot.svg` on `V3`.
4. Add `connector_dots_short.svg` or `connector_dots_long.svg` on `V4`.
5. Add `caption_plate_rounded.svg` on `V5`.
6. Create a text layer on `V6`.
7. Write a short cue like `Lengthen spine`.
8. Set the text font to `Gotham Medium` if available.
9. Set the text color to `#F6F0E8`.
10. Place the assets over the body area you want to emphasize.

## Animate In Premiere

Use Premiere keyframes on `Motion` and `Opacity`:

1. Fade the glow ring from `0` to `70-100`.
2. Scale the glow ring from about `85` to `100`.
3. Fade the dot in slightly faster than the ring.
4. Fade the connector line in after the dot.
5. Fade the caption plate and text in last.
6. Hold for `2-4` seconds.
7. Fade everything out together.

## Suggested Layer Order

- `V6` text
- `V5` caption plate
- `V4` connector line
- `V3` point dot
- `V2` glow ring
- `V1` footage

## Blend Suggestions

If Premiere allows it in your setup:

- keep glows on normal blend but reduce opacity
- use `Gaussian Blur` on duplicated glows if you want softer emphasis
- duplicate the glow ring once and enlarge the lower copy for more softness
