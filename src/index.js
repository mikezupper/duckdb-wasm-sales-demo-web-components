// index.js - Registration and wiring only
import { wrap } from "comlink";
import { map } from 'rxjs/operators';
import { DataExplorerViewModel } from './view-model.js';
import { ConnectMixin } from './connect-mixin.js';

// Import pure component classes
import { DataTable } from './components/data-table.js';
import { StatCard } from './components/stat-card.js';
import { DateRangeSlider } from './components/date-range-slider.js';
import { MultiSelectDropdown } from './components/multi-select-dropdown.js';
import { ChartSection } from './components/chart-section.js';
import {LightDomMixin} from "./light-dom-mixin.js";

const worker = new Worker(
    new URL("./db-worker.js", import.meta.url),
    { type: "module" }
);
const db = wrap(worker);

const items = ["Apples","Bananas","Cherries","Dates","Elderberries","Figs","Grapes","Honeydew"];
const rangeStart = new Date("2025-01-01");
const rangeEnd = new Date("2025-06-30");

function iso(d) { return d.toISOString().split("T")[0]; }

async function bootstrap() {
    // Initialize DB
    await db.init();
    await db.seedRandom(items, iso(rangeStart), iso(rangeEnd), 20000);

    // Create ViewModel
    const viewModel = new DataExplorerViewModel(db);

    // Register components with their state/action mappings

    customElements.define('data-table', LightDomMixin(ConnectMixin(
        viewModel,
        // mapState
        {
            headers: vm => vm.tableData$.pipe(map(d => d.headers)),
            rows: vm => vm.tableData$.pipe(map(d => d.rows)),
            currentPage: vm => vm.tableData$.pipe(map(d => d.currentPage)),
            totalPages: vm => vm.tableData$.pipe(map(d => d.totalPages)),
            pageSize: vm => vm.tableData$.pipe(map(d => d.pageSize))
        },
        // mapActions
        {
            goToFirst: vm => vm.goToFirstPage(),
            goToPrev: vm => vm.prevPage(vm.currentPage$.value),
            goToNext: vm => vm.nextPage(vm.currentPage$.value, vm.tableData$.value.totalPages),
            goToLast: vm => vm.goToLastPage(vm.tableData$.value.totalPages)
        }
    )(DataTable)));

    customElements.define('stat-card-records', LightDomMixin(ConnectMixin(
        viewModel,
        {
            value: vm => vm.stats$.pipe(map(s => s.totalRecords.toLocaleString()))
        }
    )(StatCard)));

    customElements.define('stat-card-days', LightDomMixin(ConnectMixin(
        viewModel,
        {
            value: vm => vm.stats$.pipe(map(s => `${s.dateRangeDays} days`))
        }
    )(StatCard)));

    customElements.define('date-range-slider', LightDomMixin(ConnectMixin(
        viewModel,
        {
            startDate: vm => vm.dateRange$.pipe(map(d => d.startDate)),
            endDate: vm => vm.dateRange$.pipe(map(d => d.endDate))
        },
        {
            updateRange: (vm, startDate, endDate) => vm.setDateRange(startDate, endDate)
        }
    )(DateRangeSlider)));

    customElements.define('multi-select-dropdown', LightDomMixin(ConnectMixin(
        viewModel,
        {
            selectedItems: vm => vm.selectedFruits$
        },
        {
            updateSelection: (vm, fruits) => vm.setFruitSelection(fruits)
        }
    )(MultiSelectDropdown)));

    customElements.define('chart-section', LightDomMixin(ConnectMixin(
        viewModel,
        {
            data: vm => vm.chartData$,
            badge: vm => vm.stats$.pipe(map(s => `${s.itemCount} items`))
        }
    )(ChartSection)));

    // Wire up page size change (handled by select element)
    document.getElementById('page-size').addEventListener('change', (e) => {
        viewModel.setPageSize(parseInt(e.target.value));
    });

    // Set static props
    document.querySelector('multi-select-dropdown').items = items;
    document.querySelector('date-range-slider').minDate = iso(rangeStart);
    document.querySelector('date-range-slider').maxDate = iso(rangeEnd);
    document.querySelector('stat-card-records').label = 'Total Records';
    document.querySelector('stat-card-days').label = 'Date Range';
}

bootstrap();