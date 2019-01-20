export default class DrawHelper {
    fontBySize(size) {
        return `${size}px ${this.fontName}`;
    }

    drawPercentBar(context, x, y, w, h, bookPos, textLength) {
        const pad = 3;
        const fh = h - 2*pad;
        const fh2 = fh/2;

        const t1 = `${Math.floor(bookPos/1000)}k/${Math.floor(textLength/1000)}k`;
        const w1 = context.measureText(t1).width + fh2;
        const read = bookPos/textLength;
        const t2 = `${(read*100).toFixed(2)}%`;
        const w2 = context.measureText(t2).width;
        let w3 = w - w1 - w2;

        if (w1 + w2 <= w)
            context.fillText(t1, x, y + h - 2);
        
        if (w1 + w2 + w3 <= w && w3 > (10 + fh2)) {
            const barWidth = w - w1 - w2 - fh2;
            context.strokeRect(x + w1, y + pad + 1, barWidth, fh - 2);
            context.fillRect(x + w1 + 2, y + pad + 3, (barWidth - 4)*read, fh - 6);
        }

        if (w1 <= w)
            context.fillText(t2, x + w1 + w3, y + h - 2);
    }

    async drawStatusBar(context, statusBarTop, statusBarHeight, statusBarColor, bookPos, textLength, title) {
        const y = (statusBarTop ? 1 : this.realHeight - statusBarHeight);

        context.fillStyle = this.backgroundColor;
        context.fillRect(0, y, this.realWidth, statusBarHeight);

        context.font = 'bold ' + this.fontBySize(statusBarHeight - 6);
        context.fillStyle = statusBarColor;
        context.strokeStyle = statusBarColor;

        context.fillRect(0, (statusBarTop ? statusBarHeight : y), this.realWidth, 1);

        const date = new Date();
        const time = `  ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}  `;
        const timeW = context.measureText(time).width;
        context.fillText(time, this.realWidth - timeW, y + statusBarHeight - 2);

        title = '  ' + title;
        context.fillText(this.fittingString(context, title, this.realWidth/2 - 3), 0, y + statusBarHeight - 2);

        this.drawPercentBar(context, this.realWidth/2, y, this.realWidth/2 - timeW, statusBarHeight, bookPos, textLength);
    }

    fittingString(context, str, maxWidth) {
        let w = context.measureText(str).width;
        const ellipsis = '…';
        const ellipsisWidth = context.measureText(ellipsis).width;
        if (w <= maxWidth || w <= ellipsisWidth) {
            return str;
        } else {
            let len = str.length;
            while (w >= maxWidth - ellipsisWidth && len-- > 0) {
                str = str.substring(0, len);
                w = context.measureText(str).width;
            }
            return str + ellipsis;
        }
    }


}