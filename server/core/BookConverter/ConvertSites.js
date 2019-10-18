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
    }
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
        const checkResult = this.check(data, opts);
        if (!checkResult)
            return false;

        const {hostname} = checkResult;

        let text = this.decode(data).toString();
        
        text = this[sitesFilter[hostname].converter](text, sitesFilter[hostname]);
        
        if (text === false)
            return false;

        return await super.run(Buffer.from(text), {skipCheck: true, cutTitle: true});
    }

    getTitle(text) {
        let title = '';
        const m = text.match(/<title>([\s\S]*?)<\/title>/);
        if (m)
            title = m[1];

        return `<title>${title.trim()}</title>`;
    }

    cutter(text, opts) {
        const title = this.getTitle(text);
        const l = text.indexOf(opts.begin);
        const r = text.indexOf(opts.end);
        if (l < 0 || r < 0 || r <= l)
            return false;
        
        return text.substring(l, r) + title;
    }
}

module.exports = ConvertSites;
