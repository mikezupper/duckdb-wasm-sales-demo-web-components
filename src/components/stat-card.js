// components/stat-card.js - Simple display component
import { LitElement, html } from 'lit';

export class StatCard extends LitElement {
    static properties = {
        label: { type: String },
        value: { type: String }
    };

    constructor() {
        super();
        this.label = '';
        this.value = '';
    }

    render() {
        return html`
      <div class="stat-card">
        <div class="stat-label">${this.label}</div>
        <div class="stat-value">${this.value}</div>
      </div>
    `;
    }

    createRenderRoot() {
        return this; // Light DOM
    }
}