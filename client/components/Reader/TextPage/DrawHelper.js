import {sleep} from '../../../share/utils';

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

    drawLine(line, lineIndex, baseLineIndex, sel, imageDrawn) {
        /* line:
        {
            begin: Number,
            end: Number,
            first: Boolean,
            last: Boolean,
            parts: array of {
                style: {bold: Boolean, italic: Boolean, center: Boolean},
                image: {local: Boolean, inline: Boolean, id: String, imageLine: Number, lineCount: Number, paraIndex: Number},
                text: String,
            }            
        }*/

        let out = '<div>';

        let lineText = '';
        let center = false;
        let space = 0;
        let j = 0;
        //формируем строку
        for (const part of line.parts) {
            let tOpen = '';
            tOpen += (part.style.bold ? '<b>' : '');
            tOpen += (part.style.italic ? '<i>' : '');
            tOpen += (part.style.sup ? '<span style="vertical-align: baseline; position: relative; line-height: 0; top: -0.3em">' : '');
            tOpen += (part.style.sub ? '<span style="vertical-align: baseline; position: relative; line-height: 0; top: 0.3em">' : '');
            let tClose = '';
            tClose += (part.style.sub ? '</span>' : '');
            tClose += (part.style.sup ? '</span>' : '');
            tClose += (part.style.italic ? '</i>' : '');
            tClose += (part.style.bold ? '</b>' : '');

            let text = '';
            if (lineIndex == 0 && this.searching) {
                for (let k = 0; k < part.text.length; k++) {
                    text += (sel.has(j) ? `<ins>${part.text[k]}</ins>` : part.text[k]);
                    j++;
                }
            } else
                text = part.text;

            if (text && text.trim() == '')
                text = `<span style="white-space: pre">${text}</span>`;

            lineText += `${tOpen}${text}${tClose}`;

            center = center || part.style.center;
            space = (part.style.space > space ? part.style.space : space);

            //избражения
            //image: {local: Boolean, inline: Boolean, id: String, imageLine: Number, lineCount: Number, paraIndex: Number, w: Number, h: Number},
            const img = part.image;
            if (img && img.id && !img.inline && !imageDrawn.has(img.paraIndex)) {
                const bin = this.parsed.binary[img.id];
                if (bin) {
                    let resize = '';                        
                    if (bin.h > img.h) {
                        resize = `height: ${img.h}px`;
                    }

                    const left = (this.w - img.w)/2;
                    const top = ((img.lineCount*this.lineHeight - img.h)/2) + (lineIndex - baseLineIndex - img.imageLine)*this.lineHeight;
                    if (img.local) {
                        lineText += `<img src="data:${bin.type};base64,${bin.data}" style="position: absolute; left: ${left}px; top: ${top}px; ${resize}"/>`;
                    } else {
                        lineText += `<img src="${img.id}" style="position: absolute; left: ${left}px; top: ${top}px; ${resize}"/>`;
                    }
                }
                imageDrawn.add(img.paraIndex);
            }

            if (img && img.id && img.inline) {
                if (img.local) {
                    const bin = this.parsed.binary[img.id];
                    if (bin) {
                        let resize = '';
                        if (bin.h > this.fontSize) {
                            resize = `height: ${this.fontSize - 3}px`;
                        }
                        lineText += `<img src="data:${bin.type};base64,${bin.data}" style="${resize}"/>`;
                    }
                } else {
                    //
                }
            }
        }

        const centerStyle = (center ? `text-align: center; text-align-last: center; width: ${this.w}px` : '')
        if ((line.first || space) && !center) {
            let p = (line.first ? this.p : 0);
            p = (space ? p + this.p*space : p);
            lineText = `<span style="display: inline-block; margin-left: ${p}px"></span>${lineText}`;
        }

        if (line.last || center)
            lineText = `<span style="display: inline-block; ${centerStyle}">${lineText}</span>`;

        out += lineText + '</div>';

        return out;
    }

    drawPage(lines, isScrolling) {
        if (!this.lastBook || this.pageLineCount < 1 || !this.book || !lines || !this.parsed.textLength)
            return '';

        const font = this.fontByStyle({});
        const justify = (this.textAlignJustify ? 'text-align: justify; text-align-last: justify;' : '');

        const boxH = this.h + (isScrolling ? this.lineHeight : 0);
        let out = `<div class="row no-wrap" style="width: ${this.boxW}px; height: ${boxH}px;` + 
            ` position: absolute; top: ${this.fontSize*this.textShift}px; color: ${this.textColor}; font: ${font}; ${justify}` +
            ` line-height: ${this.lineHeight}px; white-space: nowrap; vertical-align: middle;">`;

        let imageDrawn1 = new Set();
        let imageDrawn2 = new Set();
        let len = lines.length;
        const lineCount = this.pageLineCount + (isScrolling ? 1 : 0);
        len = (len > lineCount ? lineCount : len);

        //поиск
        let sel = new Set();
        if (len > 0 && this.searching) {
            const line = lines[0];
            let pureText = '';
            for (const part of line.parts) {
                pureText += part.text;
            }

            pureText = pureText.toLowerCase();
            let j = 0;
            while (1) {// eslint-disable-line no-constant-condition
                j = pureText.indexOf(this.needle, j);
                if (j >= 0) {
                    for (let k = 0; k < this.needle.length; k++) {
                        sel.add(j + k);
                    }
                } else
                    break;
                j++;
            }
        }

        //отрисовка строк
        if (!this.dualPageMode) {
            out += `<div class="fit">`;
            for (let i = 0; i < len; i++) {
                out += this.drawLine(lines[i], i, 0, sel, imageDrawn1);
            }
            out += `</div>`;
        } else {
            //левая страница
            out += `<div style="width: ${this.w}px; margin-left: ${this.dualIndentLR}px; position: relative;">`;
            const l2 = (this.pageRowsCount > len ? len : this.pageRowsCount);
            for (let i = 0; i < l2; i++) {
                out += this.drawLine(lines[i], i, 0, sel, imageDrawn1);
            }
            out += '</div>';

            //разделитель
            out += `<div style="width: ${this.dualIndentLR*2}px; top: ${-this.fontSize*this.textShift}px; position: relative">` +
                `<div class="fit row justify-center items-center">` +
                    `<div style="height: ${Math.round(boxH*this.dualDivHeight/100)}px; width: ${this.dualDivWidth}px;` + 
                        `background-image: url(&quot;data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>` +
                            //`<rect width='100%' height='100%' style='fill: none; stroke: white; stroke-width: 4; stroke-dasharray: 5 20'/>` +
                            `<line x1='0' y1='0' x2='0' y2='100%' stroke='${this.dualDivColor}' stroke-width='100%' stroke-dasharray='${this.dualDivStrokeFill} ${this.dualDivStrokeGap}'/>` +
                        `</svg>&quot;);">` +
                    `</div>` +
                `</div>` +
            `</div>`;

            //правая страница
            out += `<div style="width: ${this.w}px; margin-right: ${this.dualIndentLR}px; position: relative;">`;
            for (let i = l2; i < len; i++) {
                out += this.drawLine(lines[i], i, l2, sel, imageDrawn2);
            }
            out += '</div>';
        }

        out += '</div>';
        return out;
    }

    drawPercentBar(x, y, w, h, font, fontSize, bookPos, textLength, imageNum, imageLength) {
        const pad = 3;
        const fh = h - 2*pad;
        const fh2 = fh/2;

        const tImg = (imageNum > 0 ? ` (${imageNum}/${imageLength})` : '');
        const t1 = `${Math.floor((bookPos + 1)/1000)}/${Math.floor(textLength/1000)}${tImg}`;
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

    drawStatusBar(statusBarTop, statusBarHeight, bookPos, textLength, title, imageNum, imageLength) {

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

        out += this.drawPercentBar(this.realWidth/2, 2, this.realWidth/2 - timeW - 2*fontSize, statusBarHeight, font, fontSize, bookPos, textLength, imageNum, imageLength);
        
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

    async doPageAnimationThaw(page1, page2, duration, isDown, animation1Finish) {
        page1.style.animation = `page1-animation-thaw ${duration}ms ease-in 1`;
        page2.style.animation = `page2-animation-thaw ${duration}ms ease-in 1`;
        await animation1Finish(duration);
    }

    async doPageAnimationBlink(page1, page2, duration, isDown, animation1Finish, animation2Finish) {
        page1.style.opacity = '0';
        page2.style.opacity = '0';
        page2.style.animation = `page2-animation-thaw ${duration/2}ms ease-out 1`;
        await animation2Finish(duration/2);

        page1.style.opacity = '1';
        page1.style.animation = `page1-animation-thaw ${duration/2}ms ease-in 1`;
        await animation1Finish(duration/2);

        page2.style.opacity = '1';
    }

    async doPageAnimationRightShift(page1, page2, duration, isDown, animation1Finish) {
        const s = this.w + this.fontSize;

        if (isDown) {
            page1.style.transform = `translateX(${s}px)`;
            await sleep(30);

            page1.style.transition = `${duration}ms ease-in-out`;
            page1.style.transform = `translateX(0px)`;

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `translateX(-${s}px)`;
            await animation1Finish(duration);
        } else {
            page1.style.transform = `translateX(-${s}px)`;
            await sleep(30);

            page1.style.transition = `${duration}ms ease-in-out`;
            page1.style.transform = `translateX(0px)`;

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `translateX(${s}px)`;
            await animation1Finish(duration);
        }
    }

    async doPageAnimationDownShift(page1, page2, duration, isDown, animation1Finish) {
        const s = this.h + this.fontSize/2;

        if (isDown) {
            page1.style.transform = `translateY(${s}px)`;
            await sleep(30);

            page1.style.transition = `${duration}ms ease-in-out`;
            page1.style.transform = `translateY(0px)`;

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `translateY(-${s}px)`;
            await animation1Finish(duration);
        } else {
            page1.style.transform = `translateY(-${s}px)`;
            await sleep(30);

            page1.style.transition = `${duration}ms ease-in-out`;
            page1.style.transform = `translateY(0px)`;

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `translateY(${s}px)`;
            await animation1Finish(duration);
        }
    }

    async doPageAnimationRotate(page1, page2, duration, isDown, animation1Finish, animation2Finish) {
        if (isDown) {
            page1.style.transform = `rotateY(90deg)`;
            await sleep(30);

            page2.style.transition = `${duration/2}ms ease-in`;
            page2.style.transform = `rotateY(-90deg)`;

            await animation2Finish(duration/2);

            page1.style.transition = `${duration/2}ms ease-out`;
            page1.style.transform = `rotateY(0deg)`;
            await animation1Finish(duration/2);
        } else {
            page1.style.transform = `rotateY(-90deg)`;
            await sleep(30);

            page2.style.transition = `${duration/2}ms ease-in`;
            page2.style.transform = `rotateY(90deg)`;

            await animation2Finish(duration/2);

            page1.style.transition = `${duration/2}ms ease-out`;
            page1.style.transform = `rotateY(0deg)`;
            await animation1Finish(duration/2);
        }
    }

    async doPageAnimationFlip(page1, page2, duration, isDown, animation1Finish, animation2Finish, backgroundColor) {
        page2.style.background = backgroundColor;

        if (isDown) {
            page2.style.transformOrigin = '5%';
            await sleep(30);

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `rotateY(-120deg) translateX(${this.w/4}px)`;
            await animation2Finish(duration);
        } else {
            page2.style.transformOrigin = '95%';
            await sleep(30);

            page2.style.transition = `${duration}ms ease-in-out`;
            page2.style.transform = `rotateY(120deg) translateX(-${this.w/4}px)`;
            await animation2Finish(duration);
        }

        page2.style.transformOrigin = 'center';
        page2.style.background = '';
    }

}