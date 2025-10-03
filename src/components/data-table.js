// components/data-table.js - Pure presentational component
import { LitElement, html } from 'lit';

export class DataTable extends LitElement {
    static properties = {
        headers: { type: Array },
        rows: { type: Array },
        currentPage: { type: Number },
        totalPages: { type: Number },
        pageSize: { type: Number }
    };

    constructor() {
        super();
        // Default values
        this.headers = [];
        this.rows = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageSize = 10;
    }

    render() {
        return html`
      <div class="section-header">
        <h2>Transaction Details</h2>
        <nav class="pagination">
          <button 
            @click=${this.goToFirst} 
            ?disabled=${this.currentPage === 1}
            title="First page"
          >
            ⟪
          </button>
          <button 
            @click=${this.goToPrev} 
            ?disabled=${this.currentPage === 1}
            title="Previous page"
          >
            ‹
          </button>
          <span id="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
          <button 
            @click=${this.goToNext} 
            ?disabled=${this.currentPage === this.totalPages}
            title="Next page"
          >
            ›
          </button>
          <button 
            @click=${this.goToLast} 
            ?disabled=${this.currentPage === this.totalPages}
            title="Last page"
          >
            ⟫
          </button>
        </nav>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${this.headers.map(h => html`<th>${h}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${this.rows.map(row => html`
              <tr>
                ${row.map(cell => html`<td>${cell}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
    }

    createRenderRoot() {
        return this; // Light DOM - use global CSS
    }
}