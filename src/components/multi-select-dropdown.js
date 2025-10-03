// components/multi-select-dropdown.js - Multi-select with checkboxes
import { LitElement, html } from 'lit';

export class MultiSelectDropdown extends LitElement {
    static properties = {
        items: { type: Array },
        selectedItems: { type: Array },
        isOpen: { type: Boolean }
    };

    constructor() {
        super();
        this.items = [];
        this.selectedItems = [];
        this.isOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        // Close dropdown when clicking outside
        this._boundCloseDropdown = this._handleClickOutside.bind(this);
        document.addEventListener('click', this._boundCloseDropdown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._boundCloseDropdown);
    }

    _handleClickOutside(e) {
        if (!e.composedPath().includes(this)) {
            this.isOpen = false;
        }
    }

    _toggleDropdown(e) {
        e.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    _handleCheckboxChange(e) {
        const value = e.target.value;
        const checked = e.target.checked;

        let newSelection;
        if (value === '') {
            // "All Items" checkbox
            newSelection = [];
        } else {
            // Individual item checkbox
            newSelection = checked
                ? [...this.selectedItems, value]
                : this.selectedItems.filter(item => item !== value);
        }

        // Call injected action
        this.updateSelection(newSelection);
    }

    _getDisplayLabel() {
        if (this.selectedItems.length === 0) {
            return 'All Items';
        } else if (this.selectedItems.length === 1) {
            return this.selectedItems[0];
        } else {
            return `${this.selectedItems.length} items selected`;
        }
    }

    render() {
        const displayLabel = this._getDisplayLabel();

        return html`
      <div class="filter-group">
        <label for="fruit">Item Filter</label>
        <div class="multi-select-wrapper">
          <button 
            type="button"
            class="multi-select-trigger ${this.isOpen ? 'open' : ''}"
            @click=${this._toggleDropdown}
          >
            <span id="fruit-label">${displayLabel}</span>
            <span class="arrow">▼</span>
          </button>
          <div class="multi-select-dropdown ${this.isOpen ? 'open' : ''}">
            <label class="multi-select-option">
              <input 
                type="checkbox" 
                value="" 
                ?checked=${this.selectedItems.length === 0}
                @change=${this._handleCheckboxChange}
              />
              <span>All Items</span>
            </label>
            <div class="multi-select-divider"></div>
            ${this.items.map(item => html`
              <label class="multi-select-option">
                <input 
                  type="checkbox" 
                  value=${item}
                  ?checked=${this.selectedItems.includes(item)}
                  @change=${this._handleCheckboxChange}
                />
                <span>${item}</span>
              </label>
            `)}
          </div>
        </div>
      </div>
    `;
    }
}