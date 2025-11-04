// Calendar Tile  minimal placeholder
// The calendar is being rebuilt. This file contains a single, safe placeholder
// implementation to avoid runtime syntax errors while development continues.
// Responsive Calendar Tile
// Scales day cells so all visible days fit the tile area (month/week/5-day/3-day views)

class CalendarTile {
    constructor(container, options = {}) {
        this.container = container || document.getElementById('calendarView') || document.getElementById('calendar-tile') || document.querySelector('#calendarTile');
        this.view = options.view || 'month'; // 'month' | 'week' | '5day' | '3day'
        this.date = options.date ? new Date(options.date) : new Date();
        this.events = options.events || this.parseEventsFromContainer();

        this._onResize = this._onResize.bind(this);

        this._renderBase();
        this.render();

        // Observe resizes to recompute day height
        window.addEventListener('resize', this._onResize);
        // small debounce
        this._resizeTimer = null;
    }

    parseEventsFromContainer() {
        try {
            const raw = this.container?.dataset?.events || this.container?.getAttribute('data-events') || '[]';
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    static init(container, options) {
        return new CalendarTile(container, options);
    }

    destroy(){
        window.removeEventListener('resize', this._onResize);
    }

    _renderBase(){
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-title" id="cal-title"></div>
                <div class="calendar-controls">
                    <button id="cal-prev">◀</button>
                    <button id="cal-next">▶</button>
                    <select id="cal-view-toggle">
                        <option value="month">Month</option>
                        <option value="week">Week</option>
                        <option value="5day">5 Day</option>
                        <option value="3day">3 Day</option>
                    </select>
                </div>
            </div>
            <div class="calendar-grid" id="cal-grid"></div>
            <div class="calendar-footer" id="cal-footer"></div>
        `;

        // wire controls
        this.titleEl = this.container.querySelector('#cal-title');
        this.gridEl = this.container.querySelector('#cal-grid');
        this.footerEl = this.container.querySelector('#cal-footer');

        this.container.querySelector('#cal-prev').addEventListener('click', () => { this._navigate(-1); });
        this.container.querySelector('#cal-next').addEventListener('click', () => { this._navigate(1); });
        this.container.querySelector('#cal-view-toggle').addEventListener('change', (e) => {
            this.view = e.target.value;
            this.render();
        });

        // set select to current view
        this.container.querySelector('#cal-view-toggle').value = this.view;
    }

    _onResize(){
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(()=>{
            this._applyScaling();
        }, 80);
    }

    _navigate(dir){
        if (this.view === 'month') {
            this.date.setMonth(this.date.getMonth() + dir);
        } else if (this.view === 'week' || this.view === '5day' || this.view === '3day') {
            const days = this.view === 'week' ? 7 : (this.view === '5day' ? 5 : 3);
            this.date.setDate(this.date.getDate() + dir * days);
        }
        this.render();
    }

    render(){
        if (!this.container) return;
        if (this.view === 'month') this._renderMonth();
        else this._renderRangeView();
        this._applyScaling();
    }

    _renderMonth(){
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        // Determine grid start (start of week) and end
        const start = new Date(firstOfMonth);
        start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // Sunday start
        const end = new Date(lastOfMonth);
        end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

        const days = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
            days.push(new Date(d));
        }

        const weeks = Math.ceil(days.length / 7);

        // header title
        this.titleEl.textContent = this.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        // weekday headers (render outside of the grid so grid contains only day cells)
        const weekdayNames = [];
        for (let i = 0; i < 7; i++) weekdayNames.push(new Date(1970, 0, 4 + i).toLocaleDateString(undefined, { weekday: 'short' }));

        // remove any existing week-header
        const existingWeek = this.container.querySelector('.week-header');
        if (existingWeek) existingWeek.remove();

        const weekHeaderEl = document.createElement('div');
        weekHeaderEl.className = 'week-header';
        weekdayNames.forEach(n => {
            const el = document.createElement('div'); el.className = 'calendar-weekday'; el.textContent = n; weekHeaderEl.appendChild(el);
        });
        // insert week header before the grid
        this.gridEl.parentElement.insertBefore(weekHeaderEl, this.gridEl);

        // configure grid columns to 7 and clear grid
        this.gridEl.style.gridTemplateColumns = 'repeat(7,1fr)';
        this.gridEl.innerHTML = '';

        days.forEach(day => {
            const isOutside = day.getMonth() !== month;
            const isToday = day.toDateString() === (new Date()).toDateString();
            const cell = document.createElement('div');
            cell.className = 'calendar-day' + (isOutside ? ' outside' : '') + (isToday ? ' today' : '');
            cell.dataset.date = day.toISOString();
            const dateDiv = document.createElement('div'); dateDiv.className = 'date'; dateDiv.textContent = day.getDate();
            const eventsDiv = document.createElement('div'); eventsDiv.className = 'events';
            cell.appendChild(dateDiv); cell.appendChild(eventsDiv);
            this.gridEl.appendChild(cell);
        });
        // footer
        this.footerEl.textContent = '';
    }

    _renderRangeView(){
        // week / 5day / 3day -- show a range of days starting from the current date (aligned to week for week view)
        let start = new Date(this.date);
        if (this.view === 'week') {
            // move to Sunday of the week
            start.setDate(this.date.getDate() - this.date.getDay());
        }
        const daysCount = this.view === 'week' ? 7 : (this.view === '5day' ? 5 : 3);

        const days = [];
        for (let i=0;i<daysCount;i++){
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        this.titleEl.textContent = `${days[0].toLocaleDateString(undefined,{month:'short',day:'numeric'})} — ${days[days.length-1].toLocaleDateString(undefined,{month:'short',day:'numeric', year: days[days.length-1].getFullYear()!==days[0].getFullYear()? 'numeric': undefined})}`;

        // render headers
        let html = '';
        html += '<div class="week-header">';
        days.forEach(d => { html += `<div class="calendar-weekday">${d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>`; });
        html += '</div>';

        // configure columns to daysCount
        this.gridEl.style.gridTemplateColumns = `repeat(${daysCount}, 1fr)`;

        days.forEach(day => {
            const isToday = day.toDateString() === (new Date()).toDateString();
            html += `
                <div class="calendar-day ${isToday? 'today':''}" data-date="${day.toISOString()}">
                    <div class="date">${day.getDate()}</div>
                    <div class="events"></div>
                </div>`;
        });

        this.gridEl.innerHTML = html;
        this.gridEl.style.gridAutoRows = '1fr';
        this.footerEl.textContent = '';
    }

    _applyScaling(){
        if (!this.container || !this.gridEl) return;

        // compute available height inside container for the grid
    const rect = this.container.getBoundingClientRect();
    const headerH = this.container.querySelector('.calendar-header')?.getBoundingClientRect().height || 48;
    const weekHeaderH = this.container.querySelector('.week-header')?.getBoundingClientRect().height || 0;
    const footerH = this.container.querySelector('.calendar-footer')?.getBoundingClientRect().height || 24;
    const gapTotal = 8; // small fudge for paddings/gaps and container padding

    const available = Math.max(48, rect.height - headerH - weekHeaderH - footerH - gapTotal);

        // determine number of visible rows in current grid
        const computedStyle = getComputedStyle(this.gridEl);
        const cols = (this.view === 'month') ? 7 : parseInt(this.gridEl.style.gridTemplateColumns?.match(/repeat\((\d+),/)?.[1] || this.gridEl.children.length || 7);

        // rows for month view: compute number of weeks we rendered
        let rows = 1;
        if (this.view === 'month') {
            const days = this.gridEl.querySelectorAll('.calendar-day').length;
            rows = Math.max(1, Math.ceil(days / 7));
        } else {
            rows = 1; // for range views we show a single row
        }

        const rowGap = parseInt(getComputedStyle(this.gridEl).gap || 4, 10) || 4;
        const totalGaps = Math.max(0, rows - 1) * rowGap;
        const dayHeight = Math.floor((available - totalGaps) / rows);

        // set CSS variable used by grid-auto-rows and explicitly set gridAutoRows
        const heightValue = Math.max(28, dayHeight) + 'px';
        this.gridEl.style.setProperty('--day-height', heightValue);
        this.gridEl.style.gridAutoRows = heightValue;
    }
}

// Expose globally for the app to use
window.CalendarTile = CalendarTile;
