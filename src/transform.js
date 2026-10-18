// No network calls: emit only today's plate, keeping the stored payload small.
const CATALOGUE = [{"id":"butterfly-wing","title":"Butterfly wing","theme":"Living structures","magnification":"5,000×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Butterfly_wings_5000x_-_SEM_MUSE.tif","local_image":"assets/plates/butterfly-wing.png"},{"id":"velcro","title":"Hook-and-loop fastener","theme":"Everyday materials","magnification":"","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Velcro_-_SEM_MUSE.tif","local_image":"assets/plates/velcro.png"},{"id":"micrometeorite","title":"Micrometeorite","theme":"Minerals & space","magnification":"1,000×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Micrometeorite_1000x_-_SEM_MUSE.tif","local_image":"assets/plates/micrometeorite.png"},{"id":"paper","title":"A sheet of paper","theme":"Everyday materials","magnification":"500×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Paper_sheet_500x_-_SEM_MUSE.tif","local_image":"assets/plates/paper.png"},{"id":"pollen","title":"Pollen","theme":"Living structures","magnification":"1,000×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Pollen_1000x_-_SEM_MUSE.tif","local_image":"assets/plates/pollen.png"},{"id":"copper","title":"Copper crystal","theme":"Minerals & space","magnification":"","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Copper_crystal_-_SEM_MUSE.tif","local_image":"assets/plates/copper.png"},{"id":"cork","title":"Cork","theme":"Everyday materials","magnification":"100×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Cork_100x_-_SEM_MUSE.tif","local_image":"assets/plates/cork.png"},{"id":"hair","title":"Human hair","theme":"Living structures","magnification":"2,000×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Human_hair_2000X_-_SEM_MUSE.tif","local_image":"assets/plates/hair.png"},{"id":"fern","title":"Fern sporangia","theme":"Living structures","magnification":"250×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Fern_sporangia_250x_-_SEM_MUSE.tif","local_image":"assets/plates/fern.png"},{"id":"nylon","title":"Nylon stockings","theme":"Everyday materials","magnification":"500×","credit":"Nicola Angeli / MUSE","license":"CC BY-SA 3.0","license_url":"https://creativecommons.org/licenses/by-sa/3.0","source_page":"https://commons.wikimedia.org/wiki/File:Women_nylon_stockings_500x_-_SEM_MUSE.tif","local_image":"assets/plates/nylon.png"}];
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
    notice: 'Prototype: ten subjects, repeating after ten days.'
  };
}
if (typeof module !== 'undefined') module.exports = {run, localDate, timestamp, CATALOGUE};
