// Standalone calendar tile placeholder module
// Usage: open /tiles/calendar.html in a browser. The root container must have id="calendar-tile".

export function initCalendarTile(container){
  if(!container) container = document.getElementById('calendar-tile');
  if(!container) return;
  container.innerHTML = `
    <div style="padding:20px;text-align:center;">
      <h2 style="margin:0 0 8px;">Calendar — coming soon</h2>
      <p style="margin:0;color:#666">We're rebuilding this tile. Open the main app when it's ready.</p>
    </div>
  `;
}

// Auto-init when loaded from the standalone HTML
if(typeof document !== 'undefined'){
  const root = document.getElementById('calendar-tile');
  if(root){
    try{ initCalendarTile(root); }catch(e){ console.error('Failed to init calendar tile placeholder', e) }
  }
  // expose a simple debug handle
  window.CalendarTile = { initCalendarTile };
}
// Standalone, debug-friendly calendar tile module
// Usage: open /tiles/calendar.html in a browser. The root container must have id="calendar-tile".

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function parseEventsFromContainer(container){
  const raw = container.getAttribute('data-events') || '[]';
  try{ return JSON.parse(raw); }catch(e){ console.warn('Invalid data-events JSON', e); return [] }
}

function createButton(text, onClick){
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}

function buildCalendarElement(year, month, events){
  const wrapper = document.createElement('div');
  wrapper.className = 'calendar-wrapper';

  // header
  const header = document.createElement('div'); header.className = 'calendar-header';
  const title = document.createElement('div'); title.className = 'calendar-title';
  title.textContent = `${MONTHS[month]} ${year}`;
  const controls = document.createElement('div'); controls.className = 'calendar-controls';
  wrapper.dataset.year = year; wrapper.dataset.month = month;
  header.appendChild(title);
  header.appendChild(controls);

  // prev/next
  controls.appendChild(createButton('<', () => changeMonth(wrapper, -1)));
  controls.appendChild(createButton('Today', () => goToToday(wrapper)));
  controls.appendChild(createButton('>', () => changeMonth(wrapper, +1)));

  wrapper.appendChild(header);

  // grid: weekdays
  const grid = document.createElement('div'); grid.className = 'calendar-grid';
  for(const wd of WEEKDAYS){
    const cell = document.createElement('div'); cell.className = 'calendar-weekday'; cell.textContent = wd; grid.appendChild(cell);
  }

  // days
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // previous month's tail
  const prevMonthDays = startDay;
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for(let i = prevMonthDays - 1; i >= 0; i--){
    const d = prevMonthLastDate - i;
    const cell = buildDayCell(year, month - 1, d, events, true);
    grid.appendChild(cell);
  }

  for(let d = 1; d <= daysInMonth; d++){
    const cell = buildDayCell(year, month, d, events, false);
    grid.appendChild(cell);
  }

  // next month's head (fill upto 7 * rows)
  const totalCells = grid.children.length; const remainder = (7 - (totalCells % 7)) % 7;
  for(let i=1;i<=remainder;i++) grid.appendChild(buildDayCell(year, month + 1, i, events, true));

  wrapper.appendChild(grid);

  // footer
  const footer = document.createElement('div'); footer.className = 'calendar-footer';
  footer.textContent = `Events: ${events.length}`;
  wrapper.appendChild(footer);

  return wrapper;
}

function buildDayCell(year, month, day, events, outside){
  const cell = document.createElement('div'); cell.className = 'calendar-day';
  if(outside) cell.classList.add('outside');
  const date = document.createElement('div'); date.className = 'date'; date.textContent = day;
  cell.appendChild(date);

  const eventsWrapper = document.createElement('div'); eventsWrapper.className = 'events';
  const iso = toISODate(year, month, day);
  // show up to 2 events as pills
  const dayEvents = events.filter(e => e.date === iso);
  for(const ev of dayEvents.slice(0,2)){
    const pill = document.createElement('span'); pill.className = 'event-pill'; pill.textContent = ev.title || ev.summary || 'Event';
    eventsWrapper.appendChild(pill);
  }
  if(dayEvents.length > 2){
    const more = document.createElement('span'); more.className = 'event-pill'; more.textContent = `+${dayEvents.length-2} more`;
    eventsWrapper.appendChild(more);
  }

  cell.appendChild(eventsWrapper);
  return cell;
}

function toISODate(y, m, d){
  // month may overflow (e.g., month -1 or month 12) -> normalize by using Date
  const dt = new Date(y, m, d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2,'0');
  const dd = String(dt.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

function renderInto(container, year, month, events){
  container.innerHTML = '';
  const el = buildCalendarElement(year, month, events);
  container.appendChild(el);
}

function changeMonth(wrapper, delta){
  const currentYear = Number(wrapper.dataset.year);
  const currentMonth = Number(wrapper.dataset.month);
  const dt = new Date(currentYear, currentMonth + delta, 1);
  const root = wrapper.parentElement; // calendar-container
  const events = parseEventsFromContainer(root);
  renderInto(root, dt.getFullYear(), dt.getMonth(), events);
}

function goToToday(wrapper){
  const now = new Date();
  const root = wrapper.parentElement;
  const events = parseEventsFromContainer(root);
  renderInto(root, now.getFullYear(), now.getMonth(), events);
}

export function initCalendarTile(container){
  if(!container) throw new Error('container element required');
  console.log('initCalendarTile', {container});
  const events = parseEventsFromContainer(container) || [];
  // if no events provided, put a small demo event to help debugging
  const demo = [{date: toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), title: 'Today'}];
  const useEvents = events.length ? events : demo;
  const now = new Date();
  renderInto(container, now.getFullYear(), now.getMonth(), useEvents);
  // expose for debug
  window.CalendarTile = {container, rerender: (y,m,e)=>renderInto(container,y,m,e)};
}

// Auto-init when loaded from the standalone HTML (simple path)
if(typeof document !== 'undefined'){
  const root = document.getElementById('calendar-tile');
  if(root){
    try{ initCalendarTile(root); }catch(e){ console.error('Failed to init calendar tile', e) }
  }
}
