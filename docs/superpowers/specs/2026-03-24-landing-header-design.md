# Landing Header Design

Goal: Reposition the homepage header as a premium, editorial entry point that visually belongs to the dark hero instead of reading like a generic white navbar.

Direction:
- Keep the current information architecture: logo, `Ateliers`, `Tarifs`, `Connexion`, primary CTA.
- Replace the full-width generic white bar with a centered floating shell.
- Use a refined contrast model: warm translucent surface over the hero, deeper text, stronger CTA, subtler links.
- Strengthen the brand with a display-font wordmark while preserving readability and mobile compactness.

Visual decisions:
- Container: floating capsule, constrained width, soft border, filtered background, measured shadow.
- Brand: icon plus editorial wordmark using the loaded display font, slightly tighter tracking than the body copy.
- Navigation: lighter visual weight than the CTA, with pill hover states instead of plain text color shifts.
- CTA: darker indigo fill, sharper contrast, softer inner highlight, less "default Tailwind button" feel.
- Scroll behavior: transparent and lighter at the top, denser and slightly more compact after scroll.
- Mobile: preserve a premium CTA, but simplify spacing and visual weight to avoid crowding.

Constraints:
- Stay compatible with the existing hero palette and design tokens.
- Do not change the landing IA or add new links.
- Keep desktop and mobile behavior robust without introducing JS-heavy animation.
