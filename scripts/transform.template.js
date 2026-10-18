// No network calls: emit only today's plate, keeping the stored payload small.
const CATALOGUE = __CATALOGUE__;
const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/michaelkurath/TRMNL-Unseen/main';
const EPOCH_DAY = Date.UTC(2026, 9, 17) / 86400000;
function timestamp(input) {
  const raw = input?.trmnl?.system?.timestamp_utc;
  if (raw === undefined || raw === null || raw === '') return new Date();
  const value = typeof raw === 'number' || /^\d+(\.\d+)?$/.test(String(raw)) ? Number(raw) : raw;
  const date = new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid render timestamp');
  return date;
}
function localDate(date, user = {}) {
  for (const zone of [user.time_zone_iana, user.time_zone]) {
    if (!zone) continue;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
      const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
      return `${p.year}-${p.month}-${p.day}`;
    } catch (_) { /* Legacy names fall through to the supplied UTC offset. */ }
  }
  const offset = Number(user.utc_offset ?? 0);
  return new Date(date.getTime() + (Number.isFinite(offset) ? offset : 0) * 1000).toISOString().slice(0,10);
}
function run(input = {}) {
  const fields = input?.trmnl?.plugin_settings?.custom_fields_values ?? input.custom_fields ?? {};
  const day = localDate(timestamp(input), input?.trmnl?.user);
  const index = ((Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000) - EPOCH_DAY) % CATALOGUE.length + CATALOGUE.length) % CATALOGUE.length;
  const item = CATALOGUE[index];
  const root = String(fields.assets_base_url ?? input.assets_base_url ?? DEFAULT_BASE_URL).trim().replace(/\/+$/,'');
  const validRoot = /^https:\/\/[^\s?#]+$/i.test(root) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(root);
  const caption = ![false, 'false', 'no', 'off', '0'].includes(fields.show_caption);
  return {
    selected_entry: {...item, image_url: validRoot ? `${root}/${item.local_image}` : ''},
    date: day, display_date: day.slice(8,10) + '.' + day.slice(5,7) + '.' + day.slice(0,4),
    plate_number: String(index + 1).padStart(3,'0'), total_plates: CATALOGUE.length,
    show_caption: caption, setup_required: !validRoot,
    notice: `${CATALOGUE.length} plates, repeating after ${CATALOGUE.length} local calendar days.`
  };
}
if (typeof module !== 'undefined') module.exports = {run, localDate, timestamp, CATALOGUE};
