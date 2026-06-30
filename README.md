# Performance cost of seroval vs json.stringify on large payloads

```
pnpm run test
```

JSON.stringify is 10x faster on large payloads and 5x faster on small payloads on a MacBook Pro M5 64GB.

## Summary

```
JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > Catalog 10mb: SSR payload encode (server)
    9.38x faster than seroval serialize (tree mode)
    10.29x faster than seroval crossSerialize (sync)
    10.45x faster than seroval crossSerializeStream (TanStack default path)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > Catalog 10mb: SSR payload decode (client)
    5.46x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > Catalog 5mb: SSR payload encode (server)
    4.89x faster than seroval serialize (tree mode)
    5.90x faster than seroval crossSerialize (sync)
    5.92x faster than seroval crossSerializeStream (TanStack default path)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > Catalog 5mb: SSR payload decode (client)
    7.46x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > Catalog 1mb: SSR payload encode (server)
    4.09x faster than seroval serialize (tree mode)
    4.70x faster than seroval crossSerialize (sync)
    4.76x faster than seroval crossSerializeStream (TanStack default path)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > Catalog 1mb: SSR payload decode (client)
    7.70x faster than JSON.parse (current transport hydration)

  JSON.stringify + html-escape (current transport) - reactQuerySsrTransport.bench.ts > Catalog 128kb: SSR payload encode (server)
    4.68x faster than seroval serialize (tree mode)
    5.34x faster than seroval crossSerialize (sync)
    5.43x faster than seroval crossSerializeStream (TanStack default path)

  eval(seroval crossSerialize output) (seroval hydration, indicative) - reactQuerySsrTransport.bench.ts > Catalog 128kb: SSR payload decode (client)
    17.21x faster than JSON.parse (current transport hydration)
```

## Raw data

### 10 mb

```
--- Catalog 10mb ---
JSON.stringify (html-escaped) : 10,289,929
seroval crossSerialize        : 10,278,873
seroval crossSerializeStream  : 10,278,873


 ✓ reactQuerySsrTransport.bench.ts > Catalog 10mb: SSR payload encode (server) 11958ms
     name                                                       hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · JSON.stringify + html-escape (current transport)       124.97   7.7028   9.2021   8.0021   8.0118   8.8968   9.0736   9.2021  ±0.38%      250
   · seroval serialize (tree mode)                         13.3253  61.8259   113.27  75.0454  77.8870   113.27   113.27   113.27  ±6.24%       27
   · seroval crossSerialize (sync)                         12.1428  70.7257  94.7292  82.3533  85.5838  94.7292  94.7292  94.7292  ±3.41%       25
   · seroval crossSerializeStream (TanStack default path)  11.9636  70.1412   107.65  83.5868  87.5648   107.65   107.65   107.65  ±2.84%       48

 ✓ reactQuerySsrTransport.bench.ts > Catalog 10mb: SSR payload decode (client) 4335ms
     name                                                                      hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · JSON.parse (current transport hydration)                             96.4818  10.0007  11.5290  10.3646  10.6345  11.4798  11.5290  11.5290  ±0.43%      193
   · eval(seroval crossSerialize output) (seroval hydration, indicative)   527.10   1.4079  11.3449   1.8972   1.6321   6.8705   7.1852   8.7772  ±3.71%     1057
```

### 5mb

```
--- Catalog 5mb ---
JSON.stringify (html-escaped) : 4,556,987
seroval crossSerialize        : 4,545,931
seroval crossSerializeStream  : 4,545,931


 ✓ reactQuerySsrTransport.bench.ts > Catalog 5mb: SSR payload encode (server) 10738ms
     name                                                       hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · JSON.stringify + html-escape (current transport)       225.01   3.9891   6.4442   4.4442   4.5975   5.8634   5.9050   6.4442  ±0.87%      451
   · seroval serialize (tree mode)                         46.0098  18.9124  32.8745  21.7345  22.9300  32.8745  32.8745  32.8745  ±2.43%       93
   · seroval crossSerialize (sync)                         38.1643  22.5589  41.1440  26.2025  26.9283  41.1440  41.1440  41.1440  ±3.18%       77
   · seroval crossSerializeStream (TanStack default path)  38.0273  22.3501  40.7410  26.2969  27.6052  40.5604  40.7410  40.7410  ±2.09%      153

 ✓ reactQuerySsrTransport.bench.ts > Catalog 5mb: SSR payload decode (client) 4246ms
     name                                                                       hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · JSON.parse (current transport hydration)                               262.91  3.5468  6.0392  3.8035  3.6822  5.6052  5.6731  6.0392  ±1.05%      526
   · eval(seroval crossSerialize output) (seroval hydration, indicative)  1,962.45  0.3980  3.7889  0.5096  0.4742  2.4000  2.7058  3.4988  ±2.00%     3925
```

### 1mb

```
--- Catalog 1mb ---
JSON.stringify (html-escaped) : 911,691
seroval crossSerialize        : 907,460
seroval crossSerializeStream  : 907,460


 ✓ reactQuerySsrTransport.bench.ts > Catalog 1mb: SSR payload encode (server) 10462ms
     name                                                      hz     min      max    mean     p75      p99     p995     p999     rme  samples
   · JSON.stringify + html-escape (current transport)      895.66  0.7932   4.0023  1.1165  0.8462   3.3645   3.6442   3.9301  ±2.95%     1792
   · seroval serialize (tree mode)                         219.00  3.8039  13.6741  4.5663  4.0497   9.5742  12.3023  13.6741  ±3.37%      438
   · seroval crossSerialize (sync)                         190.54  4.4460  12.8002  5.2483  4.7171  10.5650  12.4062  12.8002  ±3.14%      382
   · seroval crossSerializeStream (TanStack default path)  188.02  4.4667  13.8680  5.3187  4.7520  11.2375  13.2553  13.8680  ±2.36%      753

 ✓ reactQuerySsrTransport.bench.ts > Catalog 1mb: SSR payload decode (client) 4217ms
     name                                                                       hz     min      max    mean     p75     p99    p995    p999     rme  samples
   · JSON.parse (current transport hydration)                             1,285.66  0.7197   3.8072  0.7778  0.7426  2.9300  3.1432  3.4986  ±1.46%     2572
   · eval(seroval crossSerialize output) (seroval hydration, indicative)  9,895.36  0.0610  52.5830  0.1011  0.0778  0.2432  2.1937  4.3018  ±7.68%    19791
```

### 128kb

```
--- Catalog 128kb ---
JSON.stringify (html-escaped) : 226,919
seroval crossSerialize        : 225,273
seroval crossSerializeStream  : 225,273


 ✓ reactQuerySsrTransport.bench.ts > Catalog 128kb: SSR payload encode (server) 10429ms
     name                                                        hz     min      max    mean     p75     p99    p995     p999     rme  samples
   · JSON.stringify + html-escape (current transport)      4,070.64  0.2004   6.3586  0.2457  0.2185  0.3339  3.8876   5.3128  ±3.08%     8142
   · seroval serialize (tree mode)                           869.40  0.9218  10.6407  1.1502  0.9907  6.8773  7.2235  10.2066  ±4.07%     1739
   · seroval crossSerialize (sync)                           762.93  1.0812  13.6942  1.3107  1.1601  6.9865  7.4382  11.9947  ±3.82%     1526
   · seroval crossSerializeStream (TanStack default path)    749.66  1.0908  18.4201  1.3339  1.1670  7.1517  7.6665  11.5052  ±2.84%     2999

 ✓ reactQuerySsrTransport.bench.ts > Catalog 128kb: SSR payload decode (client) 4246ms
     name                                                                        hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · JSON.parse (current transport hydration)                              5,230.53  0.1784  3.2693  0.1912  0.1825  0.2127  0.3630  2.6865  ±1.36%    10462
   · eval(seroval crossSerialize output) (seroval hydration, indicative)  90,033.74  0.0083  3.8690  0.0111  0.0092  0.0099  0.0106  1.1260  ±2.36%   180068
```
