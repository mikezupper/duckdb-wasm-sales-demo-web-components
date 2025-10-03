// index.js with dual-handle range slider
import { wrap } from "comlink";
import { initChart } from "./chart.js";
import { renderTable } from "./table.js";

const worker = new Worker(
    new URL("./db-worker.js", import.meta.url),
    { type: "module" }
);
const db = wrap(worker);

const items = ["Apples","Bananas","Cherries","Dates","Elderberries","Figs","Grapes","Honeydew"];

const startSlider = document.getElementById("start-slider");
const endSlider = document.getElementById("end-slider");
const startLabel = document.getElementById("start-label");
const endLabel = document.getElementById("end-label");
const fruitTrigger = document.getElementById("fruit-trigger");
const fruitDropdown = document.getElementById("fruit-dropdown");
const fruitLabel = document.getElementById("fruit-label");
const fruitOptions = document.getElementById("fruit-options");
const firstBtn = document.getElementById("first");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const lastBtn = document.getElementById("last");
const pageInfo = document.getElementById("page-info");
const pageSizeSelect = document.getElementById("page-size");
const tableEl = document.getElementById("table");
const chartEl = document.getElementById("chart");
const totalRecordsEl = document.getElementById("total-records");
const dateRangeDaysEl = document.getElementById("date-range-days");
const chartBadgeEl = document.getElementById("chart-badge");

const chart = initChart(chartEl);

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let selectedFruits = [];

const rangeStart = new Date("2025-01-01");
const rangeEnd = new Date("2025-06-30");
const totalDays = Math.floor((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

function iso(d) { return d.toISOString().split("T")[0]; }

function dateFromSlider(value) {
    const days = Math.floor((value / 100) * totalDays);
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + days);
    return date;
}

function updateLabels() {
    const startDate = dateFromSlider(parseInt(startSlider.value));
    const endDate = dateFromSlider(parseInt(endSlider.value));

    // Prevent start from going past end
    if (startDate > endDate) {
        if (startSlider === document.activeElement) {
            startSlider.value = endSlider.value;
        } else {
            endSlider.value = startSlider.value;
        }
        return updateLabels();
    }

    startLabel.textContent = iso(startDate);
    endLabel.textContent = iso(endDate);

    // Update date range days
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    dateRangeDaysEl.textContent = `${days} days`;
}

async function bootstrap() {
    console.log('Main: Bootstrapping app...');
    try {
        await db.init();
        await db.seedRandom(items, iso(rangeStart), iso(rangeEnd), 200);
        console.log('Main: Database seeded with 200 rows.');
    } catch (error) {
        console.error('Main: Bootstrap failed:', error);
        document.body.innerHTML += '<p style="color: red;">Error initializing database. Check console.</p>';
        return;
    }

    // Populate fruit multi-select options
    items.forEach(it => {
        const label = document.createElement("label");
        label.className = "multi-select-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = it;

        const span = document.createElement("span");
        span.textContent = it;

        label.appendChild(checkbox);
        label.appendChild(span);
        fruitOptions.appendChild(label);
    });

    updateLabels();
    setupMultiSelect();
    refresh();
}

function setupMultiSelect() {
    // Toggle dropdown
    fruitTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        fruitDropdown.classList.toggle("open");
        fruitTrigger.classList.toggle("open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
        fruitDropdown.classList.remove("open");
        fruitTrigger.classList.remove("open");
    });

    fruitDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // Handle checkbox changes
    fruitDropdown.addEventListener("change", (e) => {
        const checkbox = e.target;

        if (checkbox.dataset.all) {
            // "All Items" checkbox
            const allChecked = checkbox.checked;
            fruitDropdown.querySelectorAll('input[type="checkbox"]:not([data-all])').forEach(cb => {
                cb.checked = false;
            });
            selectedFruits = [];
        } else {
            // Individual item checkbox
            const allCheckbox = fruitDropdown.querySelector('input[data-all]');
            allCheckbox.checked = false;

            // Update selected fruits array
            selectedFruits = Array.from(
                fruitDropdown.querySelectorAll('input[type="checkbox"]:not([data-all]):checked')
            ).map(cb => cb.value);

            // If no items selected, check "All Items"
            if (selectedFruits.length === 0) {
                allCheckbox.checked = true;
            }
        }

        updateMultiSelectLabel();
        currentPage = 1;
        refresh();
    });
}

function updateMultiSelectLabel() {
    if (selectedFruits.length === 0) {
        fruitLabel.textContent = "All Items";
    } else if (selectedFruits.length === 1) {
        fruitLabel.textContent = selectedFruits[0];
    } else {
        fruitLabel.textContent = `${selectedFruits.length} items selected`;
    }
}

async function refresh() {
    const startDate = startLabel.textContent;
    const endDate = endLabel.textContent;
    const fruits = selectedFruits.length > 0 ? selectedFruits : null;

    console.log(`Main: Refreshing with filters - start: ${startDate}, end: ${endDate}, fruits:`, fruits || 'All');

    // For multiple fruits, we need to query differently
    let totalRows, rows, aggregates;

    if (fruits && fruits.length > 0) {
        // Query each fruit and combine results
        let allRows = [];
        let totalCount = 0;

        for (const fruit of fruits) {
            const count = await db.countRows(startDate, endDate, fruit);
            totalCount += count;

            const fruitRows = await db.queryPaginated(startDate, endDate, fruit, 1000, 0);
            allRows = allRows.concat(fruitRows);
        }

        // Sort by date and paginate
        allRows.sort((a, b) => {
            const dateA = typeof a[0] === 'string' ? a[0] : a[0].toString();
            const dateB = typeof b[0] === 'string' ? b[0] : b[0].toString();
            return dateA.localeCompare(dateB);
        });
        totalRows = totalCount;
        const start = (currentPage - 1) * pageSize;
        rows = allRows.slice(start, start + pageSize);

        // Get aggregates for selected fruits only
        const allAggregates = await db.aggregateForChart(startDate, endDate, null);
        aggregates = allAggregates.filter(agg => fruits.includes(agg.item));
    } else {
        // Query all
        totalRows = await db.countRows(startDate, endDate, null);
        rows = await db.queryPaginated(startDate, endDate, null, pageSize, (currentPage - 1) * pageSize);
        aggregates = await db.aggregateForChart(startDate, endDate, null);
    }

    totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    console.log(`Main: Total rows: ${totalRows}, Total pages: ${totalPages}, Current page: ${currentPage}`);

    // Update stats
    totalRecordsEl.textContent = totalRows.toLocaleString();

    console.log(`Main: Fetched ${rows.length} rows for table:`, rows);
    renderTable(tableEl, ["Date", "Item", "Amount"], rows);

    console.log(`Main: Fetched aggregates for chart:`, aggregates);
    chart.update(aggregates);

    // Update chart badge
    chartBadgeEl.textContent = `${aggregates.length} items`;

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    firstBtn.disabled = currentPage === 1;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    lastBtn.disabled = currentPage === totalPages;
}

startSlider.addEventListener("input", () => {
    updateLabels();
    currentPage = 1;
    refresh();
});

endSlider.addEventListener("input", () => {
    updateLabels();
    currentPage = 1;
    refresh();
});

pageSizeSelect.addEventListener("change", () => {
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1;
    refresh();
});

firstBtn.addEventListener("click", () => {
    currentPage = 1;
    refresh();
});

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        refresh();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        refresh();
    }
});

lastBtn.addEventListener("click", () => {
    currentPage = totalPages;
    refresh();
});

bootstrap();