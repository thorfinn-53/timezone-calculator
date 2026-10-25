# Timezone Calculator

The Next.js app includes its own API and stores moderator data in MongoDB. Set
`MONGODB_URI` in `.env.local` before starting the app:

```env
MONGODB_URI=your-mongodb-connection-string
```

Start the app with `npm run dev`. The frontend sends requests to the same Next.js
server; no separate Python backend is required.

## API

- `GET /api/timezones` — available IANA timezone names
- `GET /api/moderators` — saved moderators
- `POST /api/moderators` — create or update a moderator by name
- `POST /api/moderators/remove` — remove a moderator by name
- `GET /api/graph_data?slot_size=30` — UTC availability graph; add
  `include_moderators=true` to return graph data and moderator names/ranks in
  one response, with adjacent minutes of identical coverage combined into
  precise time segments
- `POST /api/reset` — remove all moderators
- `GET` and `POST /api/autosave` — read or update the autosave setting
- `POST /api/filters/mod`, `/api/filters/rank`, and `/api/filters/clear` — update graph filters
- `POST /api/save` and `/api/load` — compatibility endpoints; changes are written to MongoDB immediately

The moderator collection stores rank, timezone, UTC offset, availability ranges,
off-duty status, and filter state. Availability uses local `HH:mm` times, and
graph data is calculated from the persisted moderator records.
