class Ripple {
    constructor(elem) {
        this.elem = elem;
        this.rs = [];

        const downHandler = e => {
            const rect = e.currentTarget.getBoundingClientRect(),
                offsetX = e.clientX - rect.left,
                offsetY = e.clientY - rect.top;

            this.createRipple(offsetX, offsetY);
        }

        this.elem.onmousedown = downHandler;
        this.elem.ontouchstart = downHandler;

        const removeRipple = () => {
            const r = this.rs.shift();

            if (!r) return;

            setTimeout(() => {
                r.style.opacity = 0;
                setTimeout(() => r.remove(), 550);
            }, 250 - (new Date() - r.dataset.start));
        }

        this.elem.onmouseup = removeRipple;
        this.elem.ontouchend = removeRipple;
        this.elem.onmouseleave = () => {
            if (!this.rs || this.rs.length === 0) return;
            for (let i = 0; i < this.rs.length; i++) removeRipple();
        }
    }

    createRipple(x, y) {
        const r = document.createElement('div');
        r.classList.add('ripple__container');
        this.elem.appendChild(r);

        const w = this.elem.offsetWidth;
        const h = this.elem.offsetHeight;

        if (this.elem.classList.contains('ripple-center')) {
            r.style.top = h / 2 + 'px';
            r.style.left = w / 2 + 'px';
            r.style.transform = `scale(${Math.max(h, w)})`;
        }
        else {
            let rw = 0;
            let rh = 0;
            const m = Math.max(x + y, (w - x) + y, (w - x) + (h - y), x + (h - y));
            if (x + y === m) {
                rw = x;
                rh = y;
            } else if ((w - x) + y === m) {
                rw = (w - x);
                rh = y;
            } else if ((w - x) + (h - y) === m) {
                rw = (w - x);
                rh = (h - y);
            } else {
                rw = x;
                rh = (h - y);
            }

            const rd = Math.sqrt(Math.pow(rw, 2) + Math.pow(rh, 2));

            r.style.top = y + 'px';
            r.style.left = x + 'px';
            r.style.transform = `scale(${rd * 2})`;
        }

        r.dataset.start = +new Date();

        this.rs.push(r);
    }
}

document.querySelectorAll('.ripple').forEach(e => {
    new Ripple(e);
})