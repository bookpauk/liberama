const sax = require('./sax');

function formatXml(xmlParsed, encoding = 'utf-8', textFilterFunc) {
    let out = `<?xml version="1.0" encoding="${encoding}"?>`;
    out += formatXmlNode(xmlParsed, textFilterFunc);
    return out;
}

function formatXmlNode(node, textFilterFunc) {
    textFilterFunc = (textFilterFunc ? textFilterFunc : text => text);

    const formatXmlNodeImpl = (node, name) => {
        let out = '';

        if (Array.isArray(node)) {
            for (const n of node) {
                out += formatXmlNode(n);
            }
        } else if (typeof node == 'string') {
            if (name)
                out += `<${name}>${textFilterFunc(node)}</${name}>`;
            else
                out += textFilterFunc(node);
        } else {
            if (node._n)
                name = node._n;

            let attrs = '';
            if (node._attrs) {
                for (let attrName in node._attrs) {
                    attrs += ` ${attrName}="${node._attrs[attrName]}"`;
                }
            }

            let tOpen = '';
            let tBody = '';
            let tClose = '';
            if (name)
                tOpen += `<${name}${attrs}>`;
            if (node.hasOwnProperty('_t'))
                tBody += textFilterFunc(node._t);

            for (let nodeName in node) {
                if (nodeName && nodeName[0] == '_' && nodeName != '_a')
                    continue;

                const n = node[nodeName];
                tBody += formatXmlNodeImpl(n, nodeName);
            }
            
            if (name)
                tClose += `</${name}>`;

            out += `${tOpen}${tBody}${tClose}`;
        }
        return out;
    }

    return formatXmlNodeImpl(node);
}

function parseXml(xmlString, lowerCase = true) {
    let result = {};
    let node = result;

    const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
        node._t = text;
    };

    const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
        if (tag == '?xml')
            return;
        
        const newNode = {_n: tag, _p: node};

        if (tail) {
            const parsedAttrs = sax.getAttrsSync(tail, lowerCase);
            const atKeys = Object.keys(parsedAttrs);
            if (atKeys.length) {
                const attrs = {};
                for (let i = 0; i < atKeys.length; i++) {
                    const attrName = atKeys[i];
                    attrs[parsedAttrs[attrName].fn] = parsedAttrs[attrName].value;
                }

                newNode._attrs = attrs;
            }
        }

        if (!node._a)
            node._a = [];
        node._a.push(newNode);
        node = newNode;
    };

    const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
        if (node._p && node._n == tag)
            node = node._p;
    };

    sax.parseSync(xmlString, {
        onStartNode, onEndNode, onTextNode, lowerCase
    });

    if (result._a)
        result = result._a[0];
    
    return result;
}

function simplifyXmlParsed(node) {
    
    const simplifyNodeArray = (a) => {
        const result = {};

        for (let i = 0; i < a.length; i++) {
            const child = a[i];
            if (child._n && !result[child._n]) {
                result[child._n] = {};
                if (child._a) {
                    result[child._n] = simplifyNodeArray(child._a);
                }
                if (child._t) {
                    result[child._n]._t = child._t;
                }
                if (child._attrs) {
                    result[child._n]._attrs = child._attrs;
                }
            }
        }

        return result;
    };

    return simplifyNodeArray([node]);
}

module.exports = {
    formatXml,
    formatXmlNode,
    parseXml,
    simplifyXmlParsed
}