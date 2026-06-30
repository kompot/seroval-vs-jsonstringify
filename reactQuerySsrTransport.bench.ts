// @vitest-environment node
/**
 * Serialization strategy benchmark for the SSR query hydration payload.
 *
 * Goal: prove (or disprove) the hypothesis that TanStack Router/Start's default
 * SSR serialization (seroval `crossSerializeStream`) is poorly suited to large
 * streamed React Query payloads, and that emitting the payload as a JSON
 * `<script>` (parsed by `JSON.parse`) is materially cheaper.
 *
 * Data files:
 *   catalog-10mb.json (~10MB) — https://examplefile.com/code/json/10-mb-json
 *   catalog-5mb.json (~5MB) — https://microsoftedge.github.io/Demos/json-dummy-data/5MB.json
 *   catalog-1mb.json (~1MB) — https://microsoftedge.github.io/Demos/json-dummy-data/1MB.json
 *   catalog-128kb.json (~128KB) — https://microsoftedge.github.io/Demos/json-dummy-data/128KB.json
 *
 * All are read from disk at bench setup time (NEVER inlined).
 *
 * What we compare (server "encode" side):
 *   1. crossSerializeStream  — EXACTLY what router-core/ssr-server.js uses.
 *   2. crossSerialize        — seroval sync (isolates escaping cost from the
 *                              streaming machinery).
 *   3. serialize             — seroval tree mode (no cross-references).
 *   4. JSON.stringify + HTML-escape — what was implemented as hot fix by us.
 *
 * And on the client "decode" side:
 *   5. eval of seroval output vs JSON.parse.
 *
 * Run:  pnpm run test
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { crossSerialize, crossSerializeStream, serialize } from 'seroval';
import { ReadableStreamPlugin } from 'seroval-plugins/web';
import { bench, describe } from 'vitest';

// Router-core configures seroval with `defaultSerovalPlugins` =
// [ShallowErrorPlugin, RawStreamSSRPlugin, ReadableStreamPlugin]
// (see router-core dist/esm/ssr/serializer/seroval-plugins.js). The first two
// are internal (not exported) and only fire on Error / RawStream values; the
// catalog payload is plain JSON (objects/arrays/strings/numbers/bools), so
// they never trigger. ReadableStreamPlugin is the public one. Using just it
// faithfully reproduces seroval's behaviour for this payload while keeping the
// import path public.
const defaultSerovalPlugins = [ReadableStreamPlugin];

// ---------------------------------------------------------------------------
// Configure all three catalog datasets.
// ---------------------------------------------------------------------------
type CatalogDataset = {
  name: string;
  path: string;
};

const catalogDatasets: CatalogDataset[] = [
  {
    name: 'Catalog 10mb',
    path: './catalog-10mb.json',
  },
  {
    name: 'Catalog 5mb',
    path: './catalog-5mb.json',
  },
  {
    name: 'Catalog 1mb',
    path: './catalog-1mb.json',
  },
  {
    name: 'Catalog 128kb',
    path: './catalog-128kb.json',
  },
];

// ---------------------------------------------------------------------------
// Load a catalog file and wrap it in a dehydrated-query payload.
// ---------------------------------------------------------------------------
function loadPayload(path: string): unknown {
  const catalogJsonText = readFileSync(
    fileURLToPath(new URL(path, import.meta.url)),
    'utf8',
  );
  const catalog: unknown = JSON.parse(catalogJsonText);

  return {
    queries: [
      {
        queryHash: '["@namespace/api","get /catalog",{}]',
        queryKey: ['@namespace/api', 'get /catalog', {}],
        state: {
          data: catalog,
          dataUpdateCount: 1,
          // Fixed constant: this is bench fixture data, not runtime time.
          dataUpdatedAt: 1_700_000_000_000,
          error: null,
          errorUpdateCount: 0,
          errorUpdatedAt: 0,
          fetchFailureCount: 0,
          fetchFailureReason: null,
          fetchMeta: null,
          fetchStatus: 'idle',
          isInvalidated: false,
          status: 'success',
        },
      },
    ],
  };
}

// HTML-script-safe JSON
function serializeJsonForHtmlScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

// Faithful reproduction of how the router drives crossSerializeStream: it
// accumulates every onSerialize chunk into the script buffer. We concatenate
// to force the full serialization work (and to measure output size).
function runCrossSerializeStream(source: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = '';
    crossSerializeStream(source, {
      scopeId: 'bench',
      plugins: defaultSerovalPlugins,
      onSerialize: (data) => {
        out += data;
      },
      onError: (err) => reject(err),
      onDone: () => resolve(out),
    });
  });
}

// ---------------------------------------------------------------------------
// Helper: extract serialized text strings once for the decode benches.
// ---------------------------------------------------------------------------
type DatasetArtifacts = {
  payload: unknown;
  jsonScriptText: string;
  crossText: string;
};

function prepareDataset(dataset: CatalogDataset): DatasetArtifacts {
  const payload = loadPayload(dataset.path);
  const jsonScriptText = serializeJsonForHtmlScript(payload);
  // Pre-compile the seroval function too
  const crossText = crossSerialize(payload, {
    scopeId: 'bench',
    plugins: defaultSerovalPlugins,
  });
  return { payload, jsonScriptText, crossText };
}

// ---------------------------------------------------------------------------
// Report sizes once per dataset.
// ---------------------------------------------------------------------------
async function reportSizes(label: string, payload: unknown): Promise<void> {
  const json = serializeJsonForHtmlScript(payload);
  const cross = crossSerialize(payload, {
    scopeId: 'bench',
    plugins: defaultSerovalPlugins,
  });
  const stream = await runCrossSerializeStream(payload);
  console.log(
    [
      `--- ${label} ---`,
      `JSON.stringify (html-escaped) : ${json.length.toLocaleString()}`,
      `seroval crossSerialize        : ${cross.length.toLocaleString()}`,
      `seroval crossSerializeStream  : ${stream.length.toLocaleString()}`,
    ].join('\n'),
  );
}

// ---------------------------------------------------------------------------
// Register encode + decode bench suites per dataset.
// ---------------------------------------------------------------------------
for (const dataset of catalogDatasets) {
  const { payload, jsonScriptText, crossText } = prepareDataset(dataset);
  let sizesReported = false;

  describe(`${dataset.name}: SSR payload encode (server)`, () => {
    bench(
      'JSON.stringify + html-escape (current transport)',
      () => {
        serializeJsonForHtmlScript(payload);
      },
      { time: 2000 },
    );

    bench(
      'seroval serialize (tree mode)',
      () => {
        serialize(payload, { plugins: defaultSerovalPlugins });
      },
      { time: 2000 },
    );

    bench(
      'seroval crossSerialize (sync)',
      () => {
        crossSerialize(payload, {
          scopeId: 'bench',
          plugins: defaultSerovalPlugins,
        });
      },
      { time: 2000 },
    );

    bench(
      'seroval crossSerializeStream (TanStack default path)',
      async () => {
        if (!sizesReported) {
          sizesReported = true;
          await reportSizes(dataset.name, payload);
        }
        await runCrossSerializeStream(payload);
      },
      { time: 4000 },
    );
  });

  describe(`${dataset.name}: SSR payload decode (client)`, () => {
    bench(
      'JSON.parse (current transport hydration)',
      () => {
        JSON.parse(jsonScriptText);
      },
      { time: 2000 },
    );

    // For seroval, the browser "parse" is literally executing the emitted JS.
    // crossSerialize emits a self-contained expression. We pre-compile the
    // function ONCE (outside the timed loop) so we measure execution cost, not
    // `new Function` compilation cost — that matches the browser, which
    // compiles the inline <script> once and runs it once.
    //
    // CAVEAT: in a real browser the seroval payload arrives as an inline
    // <script> that the engine parses + compiles + executes as part of HTML
    // parsing; this micro-bench cannot fully capture that pipeline. Treat the
    // decode numbers as indicative, not authoritative. The decisive, robust
    // result is the ENCODE side (server CPU), which is unambiguous.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const evalSeroval = new Function(
      'globalThis.$R=globalThis.$R||{};globalThis.$R["bench"]=[];return (' +
      crossText +
      ');',
    );

    bench(
      'eval(seroval crossSerialize output) (seroval hydration, indicative)',
      () => {
        evalSeroval();
      },
      { time: 2000 },
    );
  });
}
