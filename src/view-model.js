// view-model.js - Reactive ViewModel with RxJS
import { BehaviorSubject, combineLatest, merge } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, shareReplay, switchMap } from 'rxjs/operators';

export class DataExplorerViewModel {
    // --- Sources of Truth (BehaviorSubjects) ---

    dateRange$ = new BehaviorSubject({
        startDate: '2025-01-01',
        endDate: '2025-06-30'
    });

    selectedFruits$ = new BehaviorSubject([]);

    pageSize$ = new BehaviorSubject(10);

    requestedPage$ = new BehaviorSubject(1);

    // --- Derived Streams ---

    // When filters change, reset to page 1
    filterChange$ = combineLatest([
        this.dateRange$,
        this.selectedFruits$
    ]).pipe(
        map(() => 1),
        shareReplay(1)
    );

    // Current page merges requested page with filter resets
    currentPage$ = merge(
        this.requestedPage$,
        this.filterChange$
    ).pipe(
        distinctUntilChanged(),
        shareReplay(1)
    );

    // Combined query parameters
    queryParams$ = combineLatest({
        dateRange: this.dateRange$,
        fruits: this.selectedFruits$,
        page: this.currentPage$,
        pageSize: this.pageSize$
    }).pipe(
        debounceTime(150), // Prevent rapid-fire queries
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        shareReplay(1)
    );

    // --- Data Queries (async operations) ---

    queryResults$ = this.queryParams$.pipe(
        switchMap(async ({ dateRange, fruits, page, pageSize }) => {
            const { startDate, endDate } = dateRange;

            // If multiple fruits selected, query each and combine
            if (fruits.length > 0) {
                let allRows = [];
                let totalCount = 0;

                for (const fruit of fruits) {
                    const count = await this.db.countRows(startDate, endDate, fruit);
                    totalCount += count;

                    const fruitRows = await this.db.queryPaginated(startDate, endDate, fruit, 1000, 0);
                    allRows = allRows.concat(fruitRows);
                }

                // Sort by date
                allRows.sort((a, b) => {
                    const dateA = typeof a[0] === 'string' ? a[0] : String(a[0]);
                    const dateB = typeof b[0] === 'string' ? b[0] : String(b[0]);
                    return dateA.localeCompare(dateB);
                });

                // Paginate client-side
                const start = (page - 1) * pageSize;
                const rows = allRows.slice(start, start + pageSize);

                // Get aggregates for selected fruits only
                const allAggregates = await this.db.aggregateForChart(startDate, endDate, null);
                const aggregates = allAggregates.filter(agg => fruits.includes(agg.item));

                return { totalRows: totalCount, rows, aggregates };
            } else {
                // Query all items
                const [totalRows, rows, aggregates] = await Promise.all([
                    this.db.countRows(startDate, endDate, null),
                    this.db.queryPaginated(startDate, endDate, null, pageSize, (page - 1) * pageSize),
                    this.db.aggregateForChart(startDate, endDate, null)
                ]);

                return { totalRows, rows, aggregates };
            }
        }),
        shareReplay(1)
    );

    // --- View-Specific Computed Values ---

    tableData$ = combineLatest({
        rows: this.queryResults$.pipe(map(r => r.rows)),
        page: this.currentPage$,
        pageSize: this.pageSize$,
        totalRows: this.queryResults$.pipe(map(r => r.totalRows))
    }).pipe(
        map(({ rows, page, pageSize, totalRows }) => ({
            headers: ["Date", "Item", "Amount"],
            rows,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalRows / pageSize)),
            pageSize
        })),
        shareReplay(1)
    );

    chartData$ = this.queryResults$.pipe(
        map(r => r.aggregates),
        shareReplay(1)
    );

    stats$ = combineLatest({
        totalRows: this.queryResults$.pipe(map(r => r.totalRows)),
        dateRange: this.dateRange$,
        itemCount: this.chartData$.pipe(map(data => data.length))
    }).pipe(
        map(({ totalRows, dateRange, itemCount }) => {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            return {
                totalRecords: totalRows,
                dateRangeDays: days,
                itemCount
            };
        }),
        shareReplay(1)
    );

    // --- Constructor ---

    constructor(db) {
        this.db = db;
    }

    // --- Actions (mutate the sources) ---

    setDateRange(startDate, endDate) {
        this.dateRange$.next({ startDate, endDate });
    }

    setFruitSelection(fruits) {
        this.selectedFruits$.next(fruits);
    }

    setPageSize(size) {
        this.pageSize$.next(size);
    }

    goToPage(page) {
        this.requestedPage$.next(page);
    }

    goToFirstPage() {
        this.requestedPage$.next(1);
    }

    goToLastPage(totalPages) {
        this.requestedPage$.next(totalPages);
    }

    nextPage(currentPage, totalPages) {
        if (currentPage < totalPages) {
            this.requestedPage$.next(currentPage + 1);
        }
    }

    prevPage(currentPage) {
        if (currentPage > 1) {
            this.requestedPage$.next(currentPage - 1);
        }
    }
}