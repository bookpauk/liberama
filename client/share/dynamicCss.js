class DynamicCss {
    constructor() {
        this.cssNodes = {};
    }

    replace(name, cssText) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = cssText;

        const parent = document.getElementsByTagName('head')[0];

        if (this.cssNodes[name]) {
            parent.removeChild(this.cssNodes[name]);
            delete this.cssNodes[name];
        }

        this.cssNodes[name] = parent.appendChild(style);
    }
}

export default new DynamicCss();