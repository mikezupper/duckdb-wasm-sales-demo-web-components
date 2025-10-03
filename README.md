# DuckDB Sales Demo

A simple web-based data explorer built with DuckDB in WebAssembly (WASM). This demo application allows users to filter and visualize randomly generated sales data for various fruits, featuring a date range slider, multi-select item filter, paginated table, and a bar chart summarizing totals by item.

The app runs entirely in the browser, leveraging DuckDB for efficient querying without a backend server.

## Features

- **In-Browser Database**: Uses DuckDB WASM for creating, seeding, and querying a sales table.
- **Random Data Seeding**: Generates 200 random sales records for fruits like Apples, Bananas, etc., between January 1, 2025, and June 30, 2025.
- **Filters**:
    - Dual-handle date range slider for selecting start and end dates.
    - Multi-select dropdown for filtering by specific items (or all items).
    - Rows per page selection for table pagination.
- **Summary Stats**: Displays total records and the number of days in the selected date range.
- **Visualization**: D3.js bar chart showing aggregated sales amounts by item.
- **Paginated Table**: Displays transaction details (date, item, amount) with navigation controls (first, previous, next, last).
- **Responsive Design**: Adapts to different screen sizes, with dark mode support via prefers-color-scheme.
- **Worker-Based Architecture**: Database operations run in a Web Worker using Comlink for seamless communication.

## Tech Stack

- **Database**: DuckDB WASM (@duckdb/duckdb-wasm)
- **Charting**: D3.js
- **Worker Communication**: Comlink
- **Build Tool**: Vite (with plugins for WASM and top-level await)
- **Styling**: CSS with layered architecture (reset, base, layout, etc.)
- **Other Libraries**: RxJS (though not heavily used in core logic)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd duckdb-sales-demo-web-components
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Development
Run the development server:
```
npm run dev
```
This starts Vite's dev server with hot module replacement. Open `http://localhost:5173` in your browser.

### Build
Build for production:
```
npm run build
```
Outputs are placed in the `dist` folder.

### Preview
Preview the production build locally:
```
npm run preview
```
Or use the alias:
```
npm run serve
```
This serves the build on `http://localhost:4173`.

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run preview`: Preview production build.
- `npm run serve`: Alias for preview on port 4173.

## Project Structure

- `index.html`: Main HTML structure with filters, stats, chart, and table sections.
- `index.js`: Application logic, including worker setup, UI event handlers, and data refresh.
- `db-worker.js`: Web Worker for DuckDB initialization, seeding, and queries (count, paginated, aggregate).
- `chart.js`: D3-based bar chart initialization and update functions.
- `table.js`: Simple table rendering function.
- `style.css`: Layered CSS for styling and responsiveness.
- `vite.config.js`: Vite configuration with WASM and top-level await plugins.
- `package.json`: Dependencies and scripts.

## Notes

- **Data Generation**: The app seeds 200 random rows on load. Dates are ISO-formatted, items are from a predefined list, and amounts are random integers between 5 and 45.
- **Querying**: Supports filtering by date range and multiple items. For multiple items, results are combined and sorted client-side.
- **Browser Support**: Requires modern browsers with WebAssembly and Worker support. Tested on Chrome, Firefox, and Safari.
- **Debugging**: Console logs are included in worker and main scripts for tracking initialization, queries, and updates.
- **Limitations**: No persistent storage; data is in-memory and resets on reload. Pagination for multi-item filters fetches all data upfront (up to 1000 rows per item) for client-side sorting.

## License

MIT License. See [LICENSE](LICENSE) for details.