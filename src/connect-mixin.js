// connect-mixin.js - DI mixin for connecting components to ViewModel
export const ConnectMixin = (viewModel, mapState, mapActions) => (superClass) => class extends superClass {
    constructor() {
        super();
        this._subscriptions = [];
    }

    connectedCallback() {
        super.connectedCallback();

        // Auto-wire state streams to reactive properties
        if (mapState) {
            Object.entries(mapState).forEach(([propName, selector]) => {
                const stream$ = selector(viewModel);
                const subscription = stream$.subscribe(value => {
                    this[propName] = value;
                    // Lit's reactive properties automatically trigger requestUpdate()
                });
                this._subscriptions.push(subscription);
            });
        }

        // Auto-wire actions as methods on the component instance
        if (mapActions) {
            Object.entries(mapActions).forEach(([methodName, action]) => {
                this[methodName] = (...args) => action(viewModel, ...args);
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Clean up all subscriptions when component unmounts
        this._subscriptions.forEach(sub => sub.unsubscribe());
        this._subscriptions = [];
    }
};