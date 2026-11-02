# Nintendo-Online Collection Link theme component

This component renders a compact **Spielesammlung** link with a bookshelf icon and a small game-count pill beside an author's name. It appears only after Nintendo-Online confirms that the author's collection is public. A public empty collection shows **0**.

It requires the `discourse-no-user-id` plugin, the NO-2025 ID route at `/u/id/:id/collection`, and `GET /api/public-collections/:id/count` returning `{ "count": 128 }` for public collections. The theme requests that endpoint with `?include=playing`; the endpoint may return `{ "count": 128, "playing": [{ "id": 42, "title": "Game", "url": "https://nintendo-online.de/games/42/game", "cover": { "url": "https://cdn.nintendo-online.de/game.jpg", "width": 300, "height": 420 } }] }`. Each cover may be `null`, and width or height may be `null`. The response remains compatible with older endpoints that ignore `include=playing` and return only `{ "count": 128 }`. Deploy the endpoint before updating the theme to show current games. The server-side Discourse plugin needs no update.

## Installation

1. Publish this directory as its own Git repository.
2. In Discourse, open **Admin → Customize → Themes → Install → From a Git repository** and add that repository URL.
3. Attach the component to the active theme.
4. Keep `collection_url_template` at its default, or set another HTTPS URL which includes `{no_user_id}` at least once.
5. Keep `collection_count_url_template` at its default, or configure the matching public-count endpoint for the same site/tenant. It must allow cross-origin GET requests without credentials. A blank setting, private collection, invalid count, or failed request hides the entire group. Invalid optional playing data leaves a valid count visible and hides only the playing group.

## Accessibility and responsive behaviour

The visible text remains **Spielesammlung**, with screen-reader context for the count; the title adds the poster's username. The decorative bookshelf is an inline SVG, so it does not depend on the forum's Font Awesome sprite. When there are playing games, the metadata group also shows a play icon, **Spielt gerade:** and the first game title. The endpoint's server ordering is authoritative: it places the most recently user-set playing game first. Additional games appear in a keyboard- and touch-accessible **+N** Float-Kit menu with lazy-loaded mini-covers. The menu is anchored and viewport-aware, with a scrollable list and a link to the full collection. Theme colours, a neutral count pill and visible keyboard focus keep the group aligned with post metadata in light and dark themes. On mobile, the playing group wraps separately and the **+N** control stays visible. No animation is added.

The component uses Discourse's `renderAfterWrapperOutlet("post-meta-data-poster-name", ...)` API instead of changing existing DOM elements. See the [Discourse Plugin API](https://github.com/discourse/discourse/blob/main/frontend/discourse/app/lib/plugin-api.gjs).

Public checks are deduplicated per endpoint URL and cached in memory for up to one minute (at most 200 entries). Requests append `include=playing`, send no cookies, and time out after five seconds. The link stays hidden while loading. A privacy change takes effect on the next check, so already displayed links can remain until the topic is reloaded; access to the collection itself is always checked by Nintendo-Online.

## Browser verification

1. Open a topic whose post JSON contains `"no_user_id": "43"` for a public collection; confirm the bookshelf, link to `/u/id/43/collection`, and correct count appear after the check.
2. Check an empty public collection: its pill must show **0** and the playing group must be absent.
3. Check a private collection, a post without `no_user_id`, a failed request and a pending request: none should render a link, icon, count or placeholder.
4. Check one and multiple playing games, an absent or invalid optional playing list, unsafe URLs, missing/broken covers, long titles, and the menu's click/tap, Enter, Space, Escape and outside-click behavior.
5. Check desktop and mobile widths, long user titles, light/dark schemes and keyboard focus. Multiple posts by the same author should share one request within a minute.

Run the URL/count checks with Node 24: `node --test tests/*.test.mjs`. Full rendering verification requires a Discourse checkout or a theme preview.
