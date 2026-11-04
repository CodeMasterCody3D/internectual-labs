# Internectual Labs design preview

This is a review branch, not a deployment to internectual.com.

- GitHub branch: `preview/threeui-lab-showcase-20261104`
- Original main commit: `8f9ee09cda4f60284d5813b51441d4aefd5deede`
- Private preview: https://internectual-design-preview-20261104.cody-dixon-7790.chatgpt.site
- `original.html` preserves the original page for comparison.
- The existing domain and default branch must remain unchanged until Cody approves a replacement.

## Changes

Add a ThreeUI Liquid Form hero with a static fallback and accessible pause control; move TK Integers into a prominent showcase with an interactive five-trit packing example; add coordinated GRIP and TAARDIS artwork; preserve the experimental project list and payment destinations; clarify the compute sponsorship goal; improve responsive typography and add social metadata.

The 2.2 bits-per-weight comparison is an exact nominal storage example from `docs/TKINTEGERS_AUTOGRID_PAPER.md` (version 1.1, October 23, 2026), not an inference-speed or quality benchmark. It assumes complete groups of 20 k1 weights and packed 12-bit scales, excluding padding and file metadata.

## Validation

- JavaScript syntax checks passed.
- Internal anchors, asset paths, unique IDs, and all three exact payment links checked.
- Desktop, 390px phone, and 768px tablet layouts visually inspected in browser.
- Packing interaction and expandable storage explanation tested.
- The QA browser reports WebGL unavailable; its static fallback is verified. The actual Liquid Form animation and physical-device performance still need user/device review.

## Attribution

Liquid Form shaders are from Meng To / ThreeUI Community. Original shader blob: `fbd9289b312f37ce13b909b3ff66cb62a44f87be`. MIT license is retained at `assets/THREEUI-LICENSE.txt`. The host was adapted to plain JavaScript, with reduced-motion support, a 30 FPS cap, a lower mobile rendering resolution, offscreen suspension, and tab-visibility resumption. Existing Internectual branding is reused from the original page.

Before any approved production merge, update the social image origin to the production domain and remove the preview toolbar and noindex metadata. Nothing in this branch automatically deploys or changes domain settings.
