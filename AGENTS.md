<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- The card is one route (`/`) with in-memory step state in `BirthdayCard`; it is a private sequential flow, so steps are not separate URLs.
- All card copy lives in `src/content/birthday.ts`; components read from it instead of hardcoding text.
- The 3D cake loads Three.js r128 + particle-cake + OrbitControls + three's postprocessing passes (EffectComposer/RenderPass/UnrealBloomPass) from pinned CDN URLs (with SRI) inside `useEffect` (`particle-cake.ts`), because they need `window` and must never run during SSR; card-specific behavior (three-tier cake, live candle flames, bloom, drag orbit, layered explosion colors, fitted text) is a subclass there, not a fork.
- Fullscreen recording mode is native fullscreen on `CakePage` with a fixed-overlay fallback for iOS; the cake stage itself stays transparent so the starry-sky background shows through, and fullscreen paints the near-black `--cinema` token with the `cinema-stage` utility in `src/styles.css`.
- Canvas drawing uses literal rgb colors (canvas can't read Tailwind tokens); DOM styling uses only tokens/utilities from `src/styles.css`.
- Music is synthesized with Web Audio (`src/lib/birthday-song.ts`) so no audio file or copyrighted track is shipped.
