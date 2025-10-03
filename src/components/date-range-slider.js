// components/date-range-slider.js - Dual-handle date range slider
import { LitElement, html } from 'lit';

export class DateRangeSlider extends LitElement {
    static properties = {
        startDate: { type: String },
        endDate: { type: String },
        minDate: { type: String },
        maxDate: { type: String }
    };

    constructor() {
        super();
        this.startDate = '';
        this.endDate = '';
        this.minDate = '';
        this.maxDate = '';
        this._startValue = 0;
        this._endValue = 100;
    }

    _getTotalDays() {
        return Math.floor((new Date(this.maxDate) - new Date(this.minDate)) / (1000 * 60 * 60 * 24));
    }

    _dateFromSliderValue(value) {
        const totalDays = this._getTotalDays();
        const days = Math.floor((value / 100) * totalDays);
        const date = new Date(this.minDate);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    _handleStartChange(e) {
        this._startValue = parseInt(e.target.value);

        // Prevent start from going past end
        if (this._startValue > this._endValue) {
            this._startValue = this._endValue;
            e.target.value = this._endValue;
        }

        const startDate = this._dateFromSliderValue(this._startValue);
        const endDate = this._dateFromSliderValue(this._endValue);
        this.updateRange(startDate, endDate);
    }

    _handleEndChange(e) {
        this._endValue = parseInt(e.target.value);

        // Prevent end from going before start
        if (this._endValue < this._startValue) {
            this._endValue = this._startValue;
            e.target.value = this._startValue;
        }

        const startDate = this._dateFromSliderValue(this._startValue);
        const endDate = this._dateFromSliderValue(this._endValue);
        this.updateRange(startDate, endDate);
    }

    render() {
        return html`
      <div class="filter-group">
        <label for="date-range">Date Range</label>
        <div class="date-range-slider">
          <input 
            type="range" 
            id="start-slider"
            min="0" 
            max="100"
            .value=${String(this._startValue)}
            @input=${this._handleStartChange}
            aria-label="Start date"
          />
          <input 
            type="range" 
            id="end-slider"
            min="0" 
            max="100"
            .value=${String(this._endValue)}
            @input=${this._handleEndChange}
            aria-label="End date"
          />
        </div>
        <div class="date-range-labels">
          <span id="start-label">${this.startDate}</span>
          <span id="end-label">${this.endDate}</span>
        </div>
      </div>
    `;
    }

    createRenderRoot() {
        return this; // Light DOM
    }
}