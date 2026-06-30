# Performance cost of seroval vs json.stringify on large payloads

```
pnpm run test
```

JSON.stringify is 10x faster on large payloads and 5x faster on small payloads.

```
  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > SSR payload encode (server) — Catalog 10mb
    9.01x faster than seroval serialize (tree mode)
    10.27x faster than seroval crossSerializeStream (TanStack default path)
    10.29x faster than seroval crossSerialize (sync)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > SSR payload decode (client) — Catalog 10mb
    5.45x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > SSR payload encode (server) — Catalog 5mb
    4.85x faster than seroval serialize (tree mode)
    5.79x faster than seroval crossSerializeStream (TanStack default path)
    5.86x faster than seroval crossSerialize (sync)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > SSR payload decode (client) — Catalog 5mb
    8.41x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > SSR payload encode (server) — Catalog 1mb
    4.07x faster than seroval serialize (tree mode)
    4.72x faster than seroval crossSerializeStream (TanStack default path)
    4.72x faster than seroval crossSerialize (sync)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > SSR payload decode (client) — Catalog 1mb
    8.32x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > SSR payload encode (server) — Catalog 128kb
    4.66x faster than seroval serialize (tree mode)
    5.31x faster than seroval crossSerialize (sync)
    5.38x faster than seroval crossSerializeStream (TanStack default path)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > SSR payload decode (client) — Catalog 128kb
    15.37x faster than JSON.parse (current transport hydration)
```
