export class Tooltip {
    constructor(frameDiv) {
        let div = document.createElement('DIV');
        div.className = "twipsy right";

        let arrow = document.createElement('DIV');
        arrow.className = "twipsy-arrow";
        div.appendChild(arrow);

        let title = document.createElement('DIV');
        title.className = "twipsy-inner";

        div.appendChild(title);

        this._div = div;
        this._title = title;

        // add to frame div and display coordinates
        frameDiv.appendChild(div);
        this.addEvent();
        this.setVisible(false);
    }

    setVisible(visible) {
        this._div.style.display = visible ? 'block' : 'none';
    }

    showAt(position, message) {
        if (position && message) {
            this.setVisible(true);
            this._title.innerHTML = message;
            // this._div.style.left = position.x + 10 + "px";
            // this._div.style.top = (position.y - this._div.clientHeight / 2) + "px";
        }
    }

    show(message) {
        if (message) {
            this.setVisible(true);
            this._title.innerHTML = message;
        }
    }

    addEvent() {
        let me = this;
        let count = 0;
        document.body.addEventListener("mousemove", function (ev) {
            if (me._div.style.display === 'block' && (count = ((count++) % 3)) === 0) {
                me._div.style.left = ev.offsetX + 20 + "px";
                me._div.style.top = (ev.offsetY - me._div.clientHeight / 2) + "px";
            }
        })
    }


}
