// light-dom-mixin.js - mixin for making LitElement's light dom only
export const LightDomMixin = (superClass) => class extends superClass {
    createRenderRoot() {
        return this; // Light DOM
    }
};