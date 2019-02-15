export default class DrawHelper {
    fontBySize(size) {
        return `${size}px ${this.fontName}`;
    }

    fontByStyle(style) {
        return `${style.italic ? 'italic' : this.fontStyle} ${style.bold ? 'bold' : this.fontWeight} ${this.fontSize}px ${this.fontName}`;
    }

    measureText(text, style) {// eslint-disable-line no-unused-vars
        this.context.font = this.fontByStyle(style);
        return this.context.measureText(text).width;
    }

    measureTextFont(text, font) {// eslint-disable-line no-unused-vars
        this.context.font = font;
        return this.context.measureText(text).width;
    }

    drawPage(lines) {
        if (!this.lastBook || this.pageLineCount < 1 || !this.book || !lines || !this.parsed.textLength)
            return '';

        const spaceWidth = this.measureText(' ', {});

        let out = `<div class="layout" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` + 
            ` color: ${this.textColor}">`;

        let len = lines.length;
        len = (len > this.pageLineCount + 1 ? this.pageLineCount + 1 : len);

        let y = this.fontSize*this.textShift;

        for (let i = 0; i < len; i++) {
            const line = lines[i];
            /* line:
            {
                begin: Number,
                end: Number,
                first: Boolean,
                last: Boolean,
                parts: array of {
                    style: {bold: Boolean, italic: Boolean, center: Boolean}
                    text: String,
                }
            }*/

            let indent = line.first ? this.p : 0;

            let lineText = '';
            let center = false;
            let centerStyle = {};
            for (const part of line.parts) {
                lineText += part.text;
                center = center || part.style.center;
                if (part.style.center)
                    centerStyle = part.style;
            }

            let filled = false;
            // если выравнивание по ширине включено
            if (this.textAlignJustify && !line.last && !center) {
                const words = lineText.split(' ');

                if (words.length > 1) {
                    const spaceCount = words.length - 1;

                    const space = (this.w - line.width + spaceWidth*spaceCount)/spaceCount;

                    let x = indent;
                    for (const part of line.parts) {
                        const font = this.fontByStyle(part.style);
                        let partWords = part.text.split(' ');

                        for (let j = 0; j < partWords.length; j++) {
                            let f = font;
                            let style = part.style;
                            let word = partWords[j];
                            if (i == 0 && this.searching && word.toLowerCase().indexOf(this.needle) >= 0) {
                                style = Object.assign({}, part.style, {bold: true});
                                f = this.fontByStyle(style);
                            }
                            out += this.fillText(word, x, y, f);
                            x += this.measureText(word, style) + (j < partWords.length - 1 ? space : 0);
                        }
                    }
                    filled = true;
                }
            }

            // просто выводим текст
            if (!filled) {
                let x = indent;
                x = (center ? (this.w - this.measureText(lineText, centerStyle))/2 : x);
                for (const part of line.parts) {
                    let font = this.fontByStyle(part.style);

                    if (i == 0 && this.searching) {//для поиска, разбивка по словам
                        let partWords = part.text.split(' ');
                        for (let j = 0; j < partWords.length; j++) {
                            let f = font;
                            let style = part.style;
                            let word = partWords[j];
                            if (word.toLowerCase().indexOf(this.needle) >= 0) {
                                style = Object.assign({}, part.style, {bold: true});
                                f = this.fontByStyle(style);
                            }
                            out += this.fillText(word, x, y, f);
                            x += this.measureText(word, style) + (j < partWords.length - 1 ? spaceWidth : 0);
                        }
                    } else {
                        out += this.fillText(part.text, x, y, font);
                        x += this.measureText(part.text, part.style);
                    }
                }
            }
            y += this.lineHeight;
        }

        out += '</div>';
        return out;
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