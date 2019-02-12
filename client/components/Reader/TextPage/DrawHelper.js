export default class DrawHelper {
    fontBySize(size) {
        return `${size}px ${this.fontName}`;
    }

    drawPercentBar(x, y, w, h, font, fontSize, bookPos, textLength) {
        const pad = 3;
        const fh = h - 2*pad;
        const fh2 = fh/2;

        const t1 = `${Math.floor((bookPos + 1)/1000)}k/${Math.floor(textLength/1000)}k`;
        const w1 = this.measureTextFont(t1, font) + fh2;
        const read = (bookPos + 1)/textLength;
        const t2 = `${(read*100).toFixed(2)}%`;
        const w2 = this.measureTextFont(t2, font);
        let w3 = w - w1 - w2;

        let out = '';
        if (w1 + w2 <= w)
            out += this.fillTextShift(t1, x, y, font, fontSize);
        
        if (w1 + w2 + w3 <= w && w3 > (10 + fh2)) {
            const barWidth = w - w1 - w2 - fh2;
            out += this.strokeRect(x + w1, y + pad, barWidth, fh - 2, this.statusBarColor);
            out += this.fillRect(x + w1 + 2, y + pad + 2, (barWidth - 4)*read, fh - 6, this.statusBarColor);
        }

        if (w1 <= w)
            out += this.fillTextShift(t2, x + w1 + w3, y, font, fontSize);

        return out;
    }

    drawStatusBar(statusBarTop, statusBarHeight, bookPos, textLength, title) {

        let out = `<div class="layout" style="` + 
            `width: ${this.realWidth}px; height: ${statusBarHeight}px; ` + 
            `color: ${this.statusBarColor}">`;

        const fontSize = statusBarHeight*0.75;
        const font = 'bold ' + this.fontBySize(fontSize);

        out += this.fillRect(0, (statusBarTop ? statusBarHeight : 0), this.realWidth, 1, this.statusBarColor);

        const date = new Date();
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const timeW = this.measureTextFont(time, font);
        out += this.fillTextShift(time, this.realWidth - timeW - fontSize, 2, font, fontSize);

        out += this.fillTextShift(this.fittingString(title, this.realWidth/2 - fontSize - 3, font), fontSize, 2, font, fontSize);

        out += this.drawPercentBar(this.realWidth/2, 2, this.realWidth/2 - timeW - 2*fontSize, statusBarHeight, font, fontSize, bookPos, textLength);
        
        out += '</div>';
        return out;
    }

    statusBarClickable(statusBarTop, statusBarHeight) {
        return `<div class="layout" style="position: absolute; ` + 
            `left: 0px; top: ${statusBarTop ? 1 : this.realHeight - statusBarHeight + 1}px; ` +
            `width: ${this.realWidth/2}px; height: ${statusBarHeight}px; cursor: pointer"></div>`;
    }

    fittingString(str, maxWidth, font) {
        let w = this.measureTextFont(str, font);
        const ellipsis = '…';
        const ellipsisWidth = this.measureTextFont(ellipsis, font);
        if (w <= maxWidth || w <= ellipsisWidth) {
            return str;
        } else {
            let len = str.length;
            while (w >= maxWidth - ellipsisWidth && len-- > 0) {
                str = str.substring(0, len);
                w = this.measureTextFont(str, font);
            }
            return str + ellipsis;
        }
    }

    fillTextShift(text, x, y, font, size, css) {
        return this.fillText(text, x, y + size*this.fontShift, font, css);        
    }

    fillText(text, x, y, font, css) {
        css = (css ? css : '');
        return `<div style="position: absolute; white-space: pre; left: ${x}px; top: ${y}px; font: ${font}; ${css}">${text}</div>`;
    }

    fillRect(x, y, w, h, color) {
        return `<div style="position: absolute; left: ${x}px; top: ${y}px; ` +
            `width: ${w}px; height: ${h}px; background-color: ${color}"></div>`; 
    }

    strokeRect(x, y, w, h, color) {
        return `<div style="position: absolute; left: ${x}px; top: ${y}px; ` +
            `width: ${w}px; height: ${h}px; box-sizing: border-box; border: 1px solid ${color}"></div>`; 
    }
}