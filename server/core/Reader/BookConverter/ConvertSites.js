const URL = require('url').URL;

const ConvertHtml = require('./ConvertHtml');

const sitesFilter = {
    'www.fanfiction.net': {
        converter: 'cutter',
        begin: `<div class='storytext xcontrast_txt nocopy' id='storytext'>`,
        end: `<div style='height:5px'></div><div style='clear:both;text-align:right;'>`,
    },
    'archiveofourown.org': {
        converter: 'cutter',
        begin: `<!-- BEGIN section where work skin applies -->`,
        end: `<!-- END work skin -->`,
    },
    'flibusta.is': {
        converter: 'flibusta'
    },
};

class ConvertSites extends ConvertHtml {
    check(data, opts) {        
        const {url, dataType} = opts;        

        const parsedUrl = new URL(url);
        if (dataType && dataType.ext == 'html') {
            if (sitesFilter[parsedUrl.hostname])
                return {hostname: parsedUrl.hostname};
        }

        return false;
    }

    async run(data, opts) {
        if (!opts.enableSitesFilter)
            return false;
        
        const checkResult = this.check(data, opts);
        if (!checkResult)
            return false;

        const {hostname} = checkResult;

        let text = this.decode(data).toString();
        
        text = this[sitesFilter[hostname].converter](text, sitesFilter[hostname]);
        
        if (text === false)
            return false;

        return await super.run(Buffer.from(text), {skipHtmlCheck: true});
    }

    getTitle(text) {
        let title = '';
        const m = text.match(/<title>([\s\S]*?)<\/title>/);
        if (m)
            title = m[1];

        return title.trim();
    }

    cutter(text, opts) {
        const title = `<title>${this.getTitle(text)}</title>`;
        const l = text.indexOf(opts.begin) + opts.begin.length;
        const r = text.indexOf(opts.end);
        if (l < 0 || r < 0 || r <= l)
            return false;
        
        return text.substring(l, r) + title;
    }

    flibusta(text) {
        let author = '';
        let m = text.match(/- <a href=".+">([\s\S]*?)<\/a><br\/?>/);
        if (m)
            author = m[1];

        let book = this.getTitle(text);
        book = book.replace(' (fb2) | Флибуста', '');

        const title = `<fb2-title>${author}${(author ? ' - ' : '')}${book}</fb2-title>`;

        let begin = '<h3 class="book">';
        if (text.indexOf(begin) <= 0)
            begin = '<h3 class=book>';

        const end = '<div id="footer">';

        const l = text.indexOf(begin);
        const r = text.indexOf(end);
        if (l < 0 || r < 0 || r <= l)
            return false;

        return text.substring(l, r)
            .replace(/blockquote class="?book"?/g, 'p')
            .replace(/<br\/?>\s*<\/h3>/g, '</h3>')
            .replace(/<h3 class="?book"?>/g, '<br><br><fb2-subtitle>')
            .replace(/<h5 class="?book"?>/g, '<br><br><fb2-subtitle>')
            .replace(/<h3>/g, '<br><br><fb2-subtitle>')
            .replace(/<h5>/g, '<br><br><fb2-subtitle>')
            .replace(/<\/h3>/g, '</fb2-subtitle><br>')
            .replace(/<\/h5>/g, '</fb2-subtitle><br>')
            .replace(/<div class="?stanza"?>/g, '<br>')
            .replace(/<div>/g, '<br>')
            + title;
    }
}

module.exports = ConvertSites;
