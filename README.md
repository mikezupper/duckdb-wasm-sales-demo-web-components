# DuckDB Sales Dashboard Demo

A reactive in-browser sales data explorer built with DuckDB WASM, Lit web components, RxJS, and D3. Demonstrates client-side data processing with a persistent IndexedDB-backed database, interactive filters, pagination, and visualizations—all without a backend server.

## Features

- **Interactive Filters**: Multi-select dropdown for items (fruits) and a dual-handle date range slider.
- **Real-time Stats**: Displays total records, date range duration, and item count badges.
- **Paginated Table**: Sortable transaction details with client-side or server-side pagination (via DuckDB queries).
- **D3 Bar Chart**: Visualizes aggregated sales by item with smooth transitions.
- **Reactive Architecture**: Uses RxJS for state management and automatic UI updates on filter changes.
- **Persistent Data**: Seeds random sales data into a DuckDB database stored in IndexedDB for persistence across sessions.
- **Web Workers**: Offloads database operations to a worker thread using Comlink.
- **Light DOM Components**: All UI components use light DOM for easier styling and integration.
- **Dark Mode Support**: Automatically adapts to system preferences via CSS media queries.
- **Accessible & Performant**: ARIA labels, keyboard navigation, and optimized queries for large datasets.

## Tech Stack

- **Database**: DuckDB via WASM (@duckdb/duckdb-wasm) for SQL queries in the browser.
- **UI Components**: Lit for lightweight web components.
- **Charting**: D3.js for the bar chart.
- **State Management**: RxJS for reactive streams and view-model pattern.
- **Workers**: Comlink for seamless worker communication.
- **Build Tool**: Vite with WASM and top-level await plugins.
- **Other**: CSS layers for modular styling, no external UI frameworks.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/duckdb-sales-demo.git
   cd duckdb-sales-demo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

4. Build for production:
   ```
   npm run build
   ```

5. Preview the build:
   ```
   npm run preview
   ```

## Usage

- The app seeds 200 random sales records for fruits (Apples, Bananas, etc.) between January 1, 2025, and June 30, 2025, on first load.
- Use the sidebar filters to select items and adjust the date range—UI updates reactively.
- Navigate the paginated table using the controls.
- The bar chart shows aggregated sales totals by item.
- Data persists in IndexedDB; refresh the page to see it retained.
- To reseed data or experiment, modify the `bootstrap()` function in `index.js`.

## Architecture Overview

- **db-worker.js**: Handles DuckDB initialization, seeding, and queries in a web worker. Exposes methods via Comlink.
- **view-model.js**: Central RxJS-based ViewModel managing state (date range, selections, pagination) and deriving data streams.
- **connect-mixin.js**: Mixin to connect Lit components to the ViewModel, mapping state streams to props and actions to methods.
- **Components** (in `components/`): Pure presentational web components like `data-table`, `stat-card`, `date-range-slider`, `multi-select-dropdown`, and `chart-section`.
- **index.js**: Wires everything together—registers components, sets up the ViewModel, and bootstraps the app.
- **index.html & style.css**: Layout and global styles using CSS grid and layers.

This setup follows a unidirectional data flow: User actions → ViewModel mutations → Derived queries → UI updates.

For multi-fruit selections, queries are parallelized per fruit, combined client-side, and paginated.

## Contributing

Contributions welcome! Please open an issue or PR for bugs, features, or improvements. Ensure code follows ES modules and reactive patterns.

## License

MIT License. See [LICENSE](LICENSE) for details.