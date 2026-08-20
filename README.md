# Nintendo-Online Collection Link theme component

This component renders a gamepad link labelled **Spielesammlung** beside an author's name when the post contains a numeric `no_user_id`.

It requires the `discourse-no-user-id` plugin and the NO-2025 ID route at `/u/id/:id/collection`.

## Installation

1. Publish this directory as its own Git repository.
2. In Discourse, open **Admin → Customize → Themes → Install → From a Git repository** and add that repository URL.
3. Attach the component to the active theme.
4. Keep `collection_url_template` at its default, or set another HTTPS URL which includes `{no_user_id}` at least once.

## Accessibility and responsive behaviour

The link has visible text, so its accessible name is “Spielesammlung”; the title adds the poster's username. It uses Discourse's `addPosterIcons` API and existing poster-link markup, so it follows the active colour scheme and remains inline on mobile without selector-based DOM modification.

## Browser verification

1. Open a topic whose post JSON contains `"no_user_id": "43"`; confirm the gamepad and link point to `/u/id/43/collection`.
2. Open a post without `no_user_id`; confirm no icon, text, or blank placeholder is rendered.
3. Check the link in desktop and mobile widths with both light and dark colour schemes.
