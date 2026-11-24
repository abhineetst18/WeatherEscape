import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, mock, test } from 'node:test';
import { API_URLS, CACHE_DURATIONS } from '../src/lib/utils/constants.js';
import { getForecastDates, parseSMHI, parseYR } from '../src/lib/utils/weatherHelpers.js';
import { calculateQualityScore, getQualityInfo } from '../src/lib/services/scoringService.js';
import { getQualityColor } from '../src/lib/utils/mapHelpers.js';
import { clearWeatherCache } from '../src/lib/services/cacheService.js';
import { fetchWeather } from '../src/lib/services/weatherService.js';

const originalTZ = process.env.TZ;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalState = Object.getOwnPropertyDescriptor(globalThis, '$state');
process.env.TZ = 'Europe/Stockholm';
const beforeMidnight = new Date('2026-11-24T22:55:00Z');
const afterMidnight = new Date('2026-11-24T23:01:00Z');
const dates = { today: '2026-11-24', tomorrow: '2026-11-25' };
const a = { lat: 57.7001, lon: 12 };
const b = { lat: 57.7002, lon: 12 }; // Distinct at provider precision; same at 2 decimals.
const one = { id: 'one', lat: 58, lon: 12, driveTimeMinutes: 25 };
const two = { id: 'two', lat: 59, lon: 12 };
const key = loc => `we-cache-weather:${loc.lat.toFixed(4)}:${loc.lon.toFixed(4)}`;
let pending, unexpected, active;
const memory = new Map();
const storage = {
  get length() { return memory.size; },
  key: i => [...memory.keys()][i] ?? null,
  getItem: k => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k)
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
globalThis.$state = value => value;
const { weather, loadForecast, setTimePeriod, toggleDay } =
  await import('../src/lib/stores/weatherStore.svelte.js');
const { settings } = await import('../src/lib/stores/settingsStore.svelte.js');
const { cancelQueuedRequests, queueDriveTime } = await import('../src/lib/services/routingService.js');

after(() => {
  for (const [name, descriptor] of [['localStorage', originalStorage], ['$state', originalState]]) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

function expectFetch(loc) {
  const url = `${API_URLS.yr}?lat=${loc.lat.toFixed(4)}&lon=${loc.lon.toFixed(4)}`;
  const request = { ...deferred(), called: deferred() };
  assert.ok(!pending.has(url));
  pending.set(url, request);
  return request;
}

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: beforeMidnight });
  memory.clear();
  storage.setItem('test-sentinel', 'untouched');
  pending = new Map();
  unexpected = [];
  active = 0;
  weather.day = 'today';
  weather.timePeriod = 'allDay';
  mock.method(globalThis, 'fetch', (url, options) => {
    const request = pending.get(url);
    if (!request || options?.cache !== 'no-store') {
      unexpected.push(url);
      return Promise.reject(new Error('Unexpected synthetic fetch'));
    }
    pending.delete(url);
    request.called.resolve();
    return request.promise;
  });
});

afterEach(() => {
  mock.restoreAll();
  mock.timers.reset();
  assert.equal(globalThis.localStorage, storage);
  assert.equal(storage.getItem('test-sentinel'), 'untouched');
  assert.deepEqual(unexpected, []);
  assert.equal(pending.size, 0);
});

function yrSample(time, temperature = 10) {
  return { time, data: {
    instant: { details: { air_temperature: temperature, cloud_area_fraction: 50, wind_speed: 4 } },
    next_1_hours: { details: { precipitation_amount: 0 }, summary: { symbol_code: 'cloudy' } }
  } };
}
const yr = (...timeseries) => ({ properties: { timeseries } });
function reply(request, data = yr(yrSample('2026-11-24T07:00:00Z'))) {
  request.resolve({ ok: true, json: async () => data });
}
function start(location, discover = async () => [], getDriveTime) {
  const id = ++active;
  return loadForecast({ location, dates: getForecastDates(), discover, getDriveTime, ownsLoad: () => active === id });
}

test('both parsers use exact local dates and leave missing dates and periods null', () => {
  assert.deepEqual(getForecastDates(), dates);
  const localTomorrow = '2026-11-24T23:05:00Z';
  const unrelated = '2026-11-26T14:00:00Z';
  const incomplete = '2026-11-24T08:00:00Z';
  const smhi = (validTime, t) => ({ validTime, parameters: Object.entries({ t, ws: 4, pmean: 0, tcc_mean: 4 })
    .map(([name, value]) => ({ name, values: [value] })) });
  const fromYR = parseYR(yr(yrSample(localTomorrow), yrSample(unrelated, 99), { time: incomplete }), dates);
  const fromSMHI = parseSMHI({ timeSeries: [smhi(localTomorrow, 10), smhi(unrelated, 99), smhi(incomplete)] }, dates);
  for (const forecast of [fromYR, fromSMHI]) {
    assert.equal(forecast.today, null);
    assert.equal(forecast.tomorrow.allDay.temperature, 10);
    assert.equal(forecast.tomorrow.allDay.precipitation, 0);
    assert.equal(forecast.tomorrow.morning, null);
    assert.equal(forecast.tomorrow.afternoon, null);
    assert.equal(forecast.tomorrow.evening, null);
  }
  assert.deepEqual(parseYR(yr(yrSample(unrelated)), dates), { today: null, tomorrow: null });
  assert.deepEqual(parseSMHI({ timeSeries: [smhi(unrelated, 99)] }, dates), { today: null, tomorrow: null });
});

test('cache preserves original timestamp, accepts tomorrow only, and uses provider precision', async () => {
  const request = expectFetch(a);
  reply(request, yr(yrSample('2026-11-25T13:00:00Z')));
  const first = await fetchWeather(a.lat, a.lon);
  assert.equal(first.fetchedAt, +beforeMidnight);
  assert.equal(first.today, null);
  mock.timers.setTime(+beforeMidnight + 60000);
  assert.deepEqual(await fetchWeather(a.lat, a.lon), first);
  await start(a);
  assert.equal(weather.lastFetched, +beforeMidnight);
  reply(expectFetch(b));
  assert.ok((await fetchWeather(b.lat, b.lon)).today);
  mock.timers.setTime(+afterMidnight); // UTC date is unchanged, local date is not.
  reply(expectFetch(a), yr(yrSample('2026-11-25T13:00:00Z')));
  const rolledOver = await fetchWeather(a.lat, a.lon);
  assert.equal(rolledOver.dates.today, dates.tomorrow);
  assert.equal(rolledOver.fetchedAt, +afterMidnight);
  assert.ok(rolledOver.today.afternoon);
});

test('cache rejects legacy, malformed, wrong date pair, and TTL boundary entries', async () => {
  const raw = async () => {
    reply(expectFetch(a));
    return fetchWeather(a.lat, a.lon);
  };
  const fresh = await raw();
  const expiry = +beforeMidnight + CACHE_DURATIONS.weather;
  for (const data of [
    { today: fresh.today },
    { ...fresh, today: { allDay: {} } },
    { ...fresh, fetchedAt: '2026-11-24' },
    { ...fresh, dates: { ...dates, tomorrow: '2026-11-28' } }
  ]) {
    storage.setItem(key(a), JSON.stringify({ data, expiry }));
    assert.deepEqual(await raw(), fresh);
  }
  storage.setItem(key(a), '{oops');
  assert.deepEqual(await raw(), fresh);
  const early = new Date('2026-11-24T14:00:00Z');
  mock.timers.setTime(+early);
  const dayCache = await raw();
  mock.timers.setTime(+early + CACHE_DURATIONS.weather - 1);
  assert.deepEqual(await fetchWeather(a.lat, a.lon), dayCache);
  mock.timers.setTime(+early + CACHE_DURATIONS.weather);
  assert.notEqual((await raw()).fetchedAt, dayCache.fetchedAt);
});

test('a successful response with no matching samples has no forecast, not a request error', async () => {
  reply(expectFetch(a), yr(yrSample('2026-11-26T15:00:00Z')));
  await start(a, () => assert.fail('No forecast dates must not start discovery'));
  assert.deepEqual(weather.base.dates, dates);
  assert.equal(weather.base.today, null);
  assert.equal(weather.base.tomorrow, null);
  assert.equal(weather.error, null);
  assert.equal(weather.loading, false);
  assert.equal(storage.getItem(key(a)), null);
});

for (const settle of ['resolve', 'reject']) {
  test(`B failure cannot be overwritten by late A ${settle}`, async () => {
    reply(expectFetch(a));
    await start(a);
    assert.ok(weather.lastFetched);
    const ar = expectFetch(a);
    clearWeatherCache();
    const aload = start(a);
    assert.deepEqual([weather.base, weather.lastFetched, weather.destinations, weather.loading], [null, null, [], true]);
    const br = expectFetch(b);
    const bload = start(b, () => assert.fail('Failed base must not start discovery'));
    br.reject(new Error('Synthetic B failure'));
    await bload;
    if (settle === 'resolve') reply(ar);
    else ar.reject(new Error('Synthetic A failure'));
    await aload;
    assert.deepEqual([weather.base, weather.lastFetched, weather.destinations, weather.loading], [null, null, [], false]);
    assert.equal(weather.error, 'errors.noWeatherData');
    assert.equal(storage.getItem(key(a)), null);
  });
}

test('stale base cleanup cannot end B loading; a late failure cannot overwrite B success', async () => {
  const ar = expectFetch(a);
  const aload = start(a);
  const br = expectFetch(b);
  const bload = start(b);
  reply(ar);
  await aload;
  assert.equal(weather.loading, true);
  assert.equal(weather.base, null);
  const discovery = deferred();
  const started = deferred();
  const a2r = expectFetch(a);
  const older = start(a, () => { started.resolve(); return discovery.promise; });
  reply(br);
  await bload;
  reply(a2r);
  await started.promise;
  reply(expectFetch(b));
  await start(b);
  discovery.reject(new Error('Older discovery failed'));
  await older;
  assert.ok(weather.base.today);
  assert.equal(weather.error, null);
  assert.equal(weather.loading, false);
});

test('absence clears a scored forecast; stale batch and route results cannot attach to reused IDs', async () => {
  const routeA = deferred();
  reply(expectFetch(a));
  reply(expectFetch(one));
  await start(a, async () => [one], () => routeA.promise);
  assert.equal(weather.destinations[0].qualityScore, 50);
  assert.ok(weather.lastFetched);
  const second = expectFetch(two);
  const batch = start(a, async () => [one, two]);
  await second.called.promise;
  await start(null);
  assert.deepEqual([weather.base, weather.lastFetched, weather.destinations, weather.error, weather.loading], [null, null, [], null, false]);
  reply(expectFetch(b));
  await start(b, async () => [one]);
  reply(second);
  routeA.resolve({ durationMinutes: 999, distanceKm: 999, isEstimate: false });
  await batch;
  assert.equal(weather.destinations.length, 1);
  assert.equal(weather.destinations[0].driveTimeMinutes, 25);
  assert.equal(storage.getItem(key(two)), null);
});

test('refresh cannot be repopulated by an older request at the same coordinates', async () => {
  const old = expectFetch(a);
  const aload = start(a);
  storage.setItem('we-cache-weather:57.70:12.00', 'legacy');
  clearWeatherCache();
  assert.equal(storage.getItem('we-cache-weather:57.70:12.00'), null);
  reply(expectFetch(a), yr(yrSample('2026-11-24T07:00:00Z', 20)));
  await start(a);
  reply(old);
  await aload;
  assert.equal(weather.base.today.allDay.temperature, 20);
  assert.equal((await fetchWeather(a.lat, a.lon)).today.allDay.temperature, 20);
});

test('real route queue keeps close origins isolated across cancellation', async t => {
  const urlA = `${API_URLS.ors}/v2/directions/driving-car?start=12,57.7001&end=12,58`;
  const urlB = `${API_URLS.ors}/v2/directions/driving-car?start=12,57.7049&end=12,58`;
  const directions = minutes => ({
    ok: true,
    json: async () => ({
      features: [{ properties: { segments: [{ duration: minutes * 60, distance: 1000 }] } }]
    })
  });
  const requestA = deferred();
  const calls = [];
  const apiKey = settings.openRouteServiceKey;
  const fetchMock = t.mock.method(globalThis, 'fetch', (url, options) => {
    calls.push(url);
    if (options?.headers?.Authorization === 'synthetic-ors-key') {
      if (url === urlA) return requestA.promise;
      if (url === urlB) return Promise.resolve(directions(17));
    }
    unexpected.push(url);
    return Promise.reject(new Error('Unexpected synthetic ORS fetch'));
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  settings.openRouteServiceKey = 'synthetic-ors-key';
  cancelQueuedRequests();

  let routeA;
  try {
    routeA = queueDriveTime(a.lat, a.lon, one.lat, one.lon);
    assert.deepEqual(calls, [urlA]);
    cancelQueuedRequests();
    const routeB = queueDriveTime(57.7049, a.lon, one.lat, one.lon);
    assert.deepEqual(calls, [urlA]);

    const legacyKey = 'we-cache-route:57.70:12.00:58.00:12.00';
    const legacy = JSON.stringify({
      data: { durationMinutes: 66, distanceKm: 1, isEstimate: false },
      expiry: +beforeMidnight + CACHE_DURATIONS.isochrone
    });
    storage.setItem(legacyKey, legacy);
    requestA.resolve(directions(99));
    assert.equal((await routeA).durationMinutes, 99);
    t.mock.timers.tick(1500);

    const resultB = await routeB;
    assert.equal(resultB.durationMinutes, 17);
    assert.equal(resultB.isEstimate, false);
    assert.deepEqual(calls, [urlA, urlB]);
    assert.equal(storage.getItem(legacyKey), legacy);
    assert.deepEqual(await queueDriveTime(57.7049, a.lon, one.lat, one.lon), resultB);
    assert.deepEqual(calls, [urlA, urlB]);
  } finally {
    cancelQueuedRequests();
    requestA.resolve(directions(99));
    await routeA;
    t.mock.timers.tick(1500);
    t.mock.timers.reset();
    fetchMock.mock.restore();
    settings.openRouteServiceKey = apiKey;
  }
});

test('cross-midnight in-flight data never publishes or caches for the prior date', async () => {
  const request = expectFetch(a);
  const load = start(a);
  mock.timers.setTime(+afterMidnight);
  reply(request);
  await load;
  assert.equal(weather.base, null);
  assert.equal(storage.getItem(key(a)), null);
  reply(expectFetch(a), yr(yrSample('2026-11-25T07:00:00Z')));
  await start(a);
  assert.equal(weather.dates.today, '2026-11-25');
  assert.equal(weather.base.today.morning.temperature, 10);
  assert.equal(weather.loading, false);
});

test('progressive callbacks and recalculation follow the same selected date and period', async () => {
  const forecast = offset => yr(
    yrSample('2026-11-24T07:00:00Z', 10 + offset),
    yrSample('2026-11-24T13:00:00Z', 12 + offset),
    yrSample('2026-11-25T13:00:00Z', 13 + offset)
  );
  reply(expectFetch(a), forecast(0));
  const first = expectFetch(one);
  const second = expectFetch(two);
  const load = start(a, async () => [one, two]);
  reply(first, forecast(2));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(weather.destinations.find(d => d.id === one.id).weather.temperature, 13);
  setTimePeriod('afternoon');
  toggleDay();
  assert.equal(weather.destinations.find(d => d.id === one.id).weather.temperature, 15);
  reply(second, forecast(5));
  await load;
  assert.deepEqual(weather.destinations.map(d => d.weather.temperature).sort(), [15, 18]);
  assert.deepEqual(weather.destinations.map(d => d.delta.temperature).sort(), [2, 5]);
  setTimePeriod('morning');
  assert.equal(weather.destinations.every(d => d.weather === null && d.delta === null && d.qualityScore === null), true);
});

test('scores are directional, neutral at 50, and marker/card bands agree', () => {
  const neutral = { cloudCover: 0, precipitation: 0, temperature: 0, windSpeed: 0, uvIndex: null };
  const better = { cloudCover: -35, precipitation: -4, temperature: 4, windSpeed: -2, uvIndex: null };
  const muchBetter = { cloudCover: -60, precipitation: -8, temperature: 7, windSpeed: -4, uvIndex: null };
  const worse = Object.fromEntries(Object.entries(better).map(([k, v]) => [k, v === null ? null : -v]));
  assert.equal(calculateQualityScore(neutral), 50);
  assert.equal(calculateQualityScore(neutral, { sunshine: .33, precipitation: .33, temperature: .33, uv: .5 }), 50);
  assert.equal(calculateQualityScore(neutral, { sunshine: Number.MAX_VALUE, wind: Number.MAX_VALUE }), 50);
  assert.equal(calculateQualityScore(better, { sunshine: 0, wind: -1, uv: Infinity }), 50);
  for (const [delta, label] of [[better, 'better'], [muchBetter, 'muchBetter'], [worse, 'worse']]) {
    assert.equal(getQualityInfo(calculateQualityScore(delta)).label, label);
  }
  for (const [score, label] of [[0, 'worse'], [44, 'worse'], [45, 'similar'], [55, 'similar'],
    [56, 'better'], [64, 'better'], [65, 'muchBetter'], [100, 'muchBetter']]) {
    assert.equal(getQualityInfo(score).label, label);
    assert.equal(getQualityColor(score), getQualityInfo(score).color);
  }
});
