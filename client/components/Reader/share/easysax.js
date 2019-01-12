'use strict';

/*
new function() {
    var parser = new EasySAXParser();

    parser.ns('rss', { // or false
        'http://search.yahoo.com/mrss/': 'media',
        'http://www.w3.org/1999/xhtml': 'xhtml',
        'http://www.w3.org/2005/Atom': 'atom',
        'http://purl.org/rss/1.0/': 'rss',
    });

    parser.on('error', function(msgError) {
    });

    parser.on('startNode', function(elemName, getAttr, isTagEnd, getStrNode) {
        var attr = getAttr();
    });

    parser.on('endNode', function(elemName, isTagStart, getStrNode) {
    });

    parser.on('textNode', function(text) {
    });

    parser.on('cdata', function(data) {
    });


    parser.on('comment', function(text) {
        //console.log('--'+text+'--')
    });

    //parser.on('unknownNS', function(key) {console.log('unknownNS: ' + key)});
    //parser.on('question', function() {}); // <? ... ?>
    //parser.on('attention', function() {}); // <!XXXXX zzzz="eeee">

    console.time('easysax');
    for(var z=1000;z--;) {
        parser.parse(xml)
    };
    console.timeEnd('easysax');
};

*/

// << ------------------------------------------------------------------------ >> //

EasySAXParser.entityDecode = xmlEntityDecode;
export default EasySAXParser;

var stringFromCharCode = String.fromCharCode;
var objectCreate = Object.create;
function NULL_FUNC() {};

function entity2char(x) {
    if (x === 'amp') {
        return '&';
    };

    switch(x.toLocaleLowerCase()) {
        case 'quot': return '"';
        case 'amp': return '&'
        case 'lt': return '<'
        case 'gt': return '>'

        case 'plusmn': return '\u00B1';
        case 'laquo': return '\u00AB';
        case 'raquo': return '\u00BB';
        case 'micro': return '\u00B5';
        case 'nbsp': return '\u00A0';
        case 'copy': return '\u00A9';
        case 'sup2': return '\u00B2';
        case 'sup3': return '\u00B3';
        case 'para': return '\u00B6';
        case 'reg': return '\u00AE';
        case 'deg': return '\u00B0';
        case 'apos': return '\'';
    };

    return '&' + x + ';';
};

function replaceEntities(s, d, x, z) {
    if (z) {
        return entity2char(z);
    };

    if (d) {
        return stringFromCharCode(d);
    };

    return stringFromCharCode(parseInt(x, 16));
};

function xmlEntityDecode(s) {
    var s = ('' + s);

    if (s.length > 3 && s.indexOf('&') !== -1) {
        if (s.indexOf('&lt;') !== -1) {s = s.replace(/&lt;/g, '<');}
        if (s.indexOf('&gt;') !== -1) {s = s.replace(/&gt;/g, '>');}
        if (s.indexOf('&quot;') !== -1) {s = s.replace(/&quot;/g, '"');}

        if (s.indexOf('&') !== -1) {
            s = s.replace(/&#(\d+);|&#x([0123456789abcdef]+);|&(\w+);/ig, replaceEntities);
        };
    };

    return s;
};

function cloneMatrixNS(nsmatrix) {
    var nn = objectCreate(null);
    for (var n in nsmatrix) {
        nn[n] = nsmatrix[n];
    };
    return nn;
};


function EasySAXParser(config) {
    if (!this) {
        return null;
    };

    var onTextNode = NULL_FUNC, onStartNode = NULL_FUNC, onEndNode = NULL_FUNC, onCDATA = NULL_FUNC, onError = NULL_FUNC, onComment, onQuestion, onAttention, onUnknownNS;
    var is_onComment = false, is_onQuestion = false, is_onAttention = false, is_onUnknownNS = false;

    var isAutoEntity = true; // делать "EntityDecode" всегда
    var entityDecode = xmlEntityDecode;
    var hasSurmiseNS = false;
    var isNamespace = false;
    var returnError = null;
    var parseStop = false; // прервать парсер
    var defaultNS;
    var nsmatrix = null;
    var useNS;
    var xml = ''; // string


    this.setup = function (op) {
        for (var name in op) {
            switch(name) {
                case 'entityDecode': entityDecode = op.entityDecode || entityDecode; break;
                case 'autoEntity': isAutoEntity = !!op.autoEntity; break;
                case 'defaultNS': defaultNS = op.defaultNS || null; break;
                case 'ns': isNamespace = !!(useNS = op.ns || null); break;
                case 'on':
                    var listeners = op.on;
                    for (var ev in listeners) {
                        this.on(ev, listeners[ev]);
                    };
                break;
            };
        };
    };

    this.on = function(name, cb) {
        if (typeof cb !== 'function') {
            if (cb !== null) {
                throw error('required args on(string, function||null)');
            };
        };

        switch(name) {
            case 'startNode': onStartNode = cb || NULL_FUNC; break;
            case 'textNode': onTextNode = cb || NULL_FUNC; break;
            case 'endNode': onEndNode = cb || NULL_FUNC; break;
            case 'error': onError = cb || NULL_FUNC; break;
            case 'cdata': onCDATA = cb || NULL_FUNC; break;

            case 'unknownNS': onUnknownNS = cb; is_onUnknownNS = !!cb; break;
            case 'attention': onAttention = cb; is_onAttention = !!cb; break; // <!XXXXX zzzz="eeee">
            case 'question': onQuestion = cb; is_onQuestion = !!cb; break; // <? ....  ?>
            case 'comment': onComment = cb; is_onComment = !!cb; break;
        };
    };

    this.ns = function(root, ns) {
        if (!root) {
            isNamespace = false;
            defaultNS = null;
            useNS = null;
            return this;
        };

        if (!ns || typeof root !== 'string') {
            throw error('required args ns(string, object)');
        };

        isNamespace = !!(useNS = ns || null);
        defaultNS = root || null;

        return this;
    };

    this.parse = function(_xml) {
        if (typeof _xml !== 'string') {
            return 'required args parser(string)'; // error
        };

        returnError = null;
        xml = _xml;

        if (isNamespace) {
            nsmatrix = objectCreate(null);
            nsmatrix.xmlns = defaultNS;

            parse();

            nsmatrix = null;

        } else {
            parse();
        };

        parseStop = false;
        attrRes = true;
        xml = '';

        return returnError;
    };

    this.stop = function() {
        parseStop = true;
    };

    if (config) {
        this.setup(config);
    };

    // -----------------------------------------------------


    var stringNodePosStart; // number
    var stringNodePosEnd; // number
    var attrStartPos; // number начало позиции атрибутов в строке attrString <(div^ class="xxxx" title="sssss")/>
    var attrString; // строка атрибутов <(div class="xxxx" title="sssss")/>
    var attrRes; // закешированный результат разбора атрибутов , null - разбор не проводился, object - хеш атрибутов, true - нет атрибутов, false - невалидный xml

    /*
        парсит атрибуты по требованию. Важно! - функция не генерирует исключения.

        если была ошибка разбора возврашается false
        если атрибутов нет и разбор удачен то возврашается true
        если есть атрибуты то возврашается обьект(хеш)
    */

    function getAttrs() {
        if (attrRes !== null) {
            return attrRes;
        };

        var xmlnsAlias;
        var nsAttrName;
        var attrList = isNamespace && hasSurmiseNS ? [] : null;
        var i = attrStartPos + 1; // так как первый символ уже был проверен
        var s = attrString;
        var l = s.length;
        var hasNewMatrix;
        var newalias;
        var value;
        var alias;
        var name;
        var res = {};
        var ok;
        var w;
        var j;


        for(; i < l; i++) {
            w = s.charCodeAt(i);

            if (w === 32 || (w < 14 && w > 8) ) { // \f\n\r\t\v
                continue
            };

            if (w < 65 || w > 122 || (w > 90 && w < 97) ) { // недопустимые первые символы
                if (w !== 95 && w !== 58) { // char 95"_" 58":"
                    return attrRes = false; // error. invalid first char
                };
            };

            for(j = i + 1; j < l; j++) { // проверяем все символы имени атрибута
                w = s.charCodeAt(j);

                if ( w > 96 && w < 123 || w > 64 && w < 91 || w > 47 && w < 59 || w === 45 || w === 95) {
                    continue;
                };

                if (w !== 61) { // "=" == 61
                    return attrRes = false; // error. invalid char "="
                };

                break;
            };

            name = s.substring(i, j);
            ok = true;

            if (name === 'xmlns:xmlns') {
                return attrRes = false; // error. invalid name
            };

            w = s.charCodeAt(j + 1);

            if (w === 34) {  // '"'
                j = s.indexOf('"', i = j + 2 );

            } else {
                if (w !== 39) { // "'"
                    return attrRes = false; // error. invalid char
                };

                j = s.indexOf('\'', i = j + 2 );
            };

            if (j === -1) {
                return attrRes = false; // error. invalid char
            };

            if (j + 1 < l) {
                w = s.charCodeAt(j + 1);

                if (w > 32 || w < 9 || (w < 32 && w > 13)) {
                    // error. invalid char
                    return attrRes = false;
                };
            };


            value = s.substring(i, j);
            i = j + 1; // след. семвол уже проверен потому проверять нужно следуюший

            if (isAutoEntity) {
                value = entityDecode(value);
            };

            if (!isNamespace) { //
                res[name] = value;
                continue;
            };

            if (hasSurmiseNS) {
                // есть подозрение что в атрибутах присутствует xmlns
                newalias = (name !== 'xmlns'
                    ? name.charCodeAt(0) === 120 && name.substr(0, 6) === 'xmlns:' ? name.substr(6) : null
                    : 'xmlns'
                );

                if (newalias !== null) {
                    alias = useNS[entityDecode(value)];
                    if (is_onUnknownNS && !alias) {
                        alias = onUnknownNS(value);
                    };

                    if (alias) {
                        if (nsmatrix[newalias] !== alias) {
                            if (!hasNewMatrix) {
                                nsmatrix = cloneMatrixNS(nsmatrix);
                                hasNewMatrix = true;
                            };

                            nsmatrix[newalias] = alias;
                        };
                    } else {
                        if (nsmatrix[newalias]) {
                            if (!hasNewMatrix) {
                                nsmatrix = cloneMatrixNS(nsmatrix);
                                hasNewMatrix = true;
                            };

                            nsmatrix[newalias] = false;
                        };
                    };

                    res[name] = value;
                    continue;
                };

                attrList.push(name, value);
                continue;
            };

            w = name.indexOf(':');
            if (w === -1) {
                res[name] = value;
                continue;
            };

            if (nsAttrName = nsmatrix[name.substring(0, w)]) {
                nsAttrName = nsmatrix['xmlns'] === nsAttrName ? name.substr(w + 1) : nsAttrName + name.substr(w);
                res[nsAttrName + name.substr(w)] = value;
            };
        };


        if (!ok) {
            return attrRes = true;  // атрибутов нет, ошибок тоже нет
        };

        if (hasSurmiseNS)  {
            xmlnsAlias = nsmatrix['xmlns'];

            for (i = 0, l = attrList.length; i < l; i++) {
                name = attrList[i++];

                w = name.indexOf(':');
                if (w !== -1) {
                    if (nsAttrName = nsmatrix[name.substring(0, w)]) {
                        nsAttrName = xmlnsAlias === nsAttrName ? name.substr(w + 1) : nsAttrName + name.substr(w);
                        res[nsAttrName] = attrList[i];
                    };
                    continue;
                };
                res[name] = attrList[i];
            };
        };

        return attrRes = res;
    };

    function getStringNode() {
        return xml.substring(stringNodePosStart, stringNodePosEnd + 1);
    };


    function parse() {
        var stacknsmatrix = [];
        var nodestack = [];
        var stopIndex = 0;
        var _nsmatrix;
        var isTagStart = false;
        var isTagEnd = false;
        var x, y, q, w;
        var j = 0;
        var i = 0;
        var xmlns;
        var elem;
        var stop; // используется при разборе "namespace" . если встретился неизвестное пространство то события не генерируются


        while(j !== -1) {
            stop = stopIndex > 0;

            if (xml.charCodeAt(j) === 60) { // "<"
                i = j;
            } else {
                i = xml.indexOf('<', j);
            };

            if (i === -1) { // конец разбора
                if (nodestack.length) {
                    onError(returnError = 'unexpected end parse');
                    return;
                };

                if (j === 0) {
                    onError(returnError = 'missing first tag');
                    return;
                };

                return;
            };

            if (j !== i && !stop) {
                onTextNode(isAutoEntity ? entityDecode(xml.substring(j, i)) : xml.substring(j, i));
                if (parseStop) {
                    return;
                };
            };

            w = xml.charCodeAt(i+1);

            if (w === 33) { // "!"
                w = xml.charCodeAt(i+2);
                if (w === 91 && xml.substr(i + 3, 6) === 'CDATA[') { // 91 == "["
                    j = xml.indexOf(']]>', i);
                    if (j === -1) {
                        onError(returnError = 'cdata');
                        return;
                    };

                    if (!stop) {
                        onCDATA(xml.substring(i + 9, j));
                        if (parseStop) {
                            return;
                        };
                    };

                    j += 3;
                    continue;
                };


                if (w === 45 && xml.charCodeAt(i + 3) === 45) { // 45 == "-"
                    j = xml.indexOf('-->', i);
                    if (j === -1) {
                        onError(returnError = 'expected -->');
                        return;
                    };


                    if (is_onComment && !stop) {
                        onComment(isAutoEntity ? entityDecode(xml.substring(i + 4, j)) : xml.substring(i + 4, j));
                        if (parseStop) {
                            return;
                        };
                    };

                    j += 3;
                    continue;
                };

                j = xml.indexOf('>', i + 1);
                if (j === -1) {
                    onError(returnError = 'expected ">"');
                    return;
                };

                if (is_onAttention && !stop) {
                    onAttention(xml.substring(i, j + 1));
                    if (parseStop) {
                        return;
                    };
                };

                j += 1;
                continue;
            };

            if (w === 63) { // "?"
                j = xml.indexOf('?>', i);
                if (j === -1) { // error
                    onError(returnError = '...?>');
                    return;
                };

                if (is_onQuestion) {
                    onQuestion(xml.substring(i, j + 2));
                    if (parseStop) {
                        return;
                    };
                };

                j += 2;
                continue;
            };

            j = xml.indexOf('>', i + 1);

            if (j == -1) { // error
                onError(returnError = 'unclosed tag'); // ...>
                return;
            };

            attrRes = true; // атрибутов нет

            //if (xml.charCodeAt(i+1) === 47) { // </...
            if (w === 47) { // </...
                isTagStart = false;
                isTagEnd = true;

                // проверяем что должен быть закрыт тотже тег что и открывался
                if (!nodestack.length) {
                    onError(returnError = 'close tag, requires open tag');
                    return;
                };

                x = elem = nodestack.pop();
                q = i + 2 + elem.length;

                if (elem !== xml.substring(i + 2, q)) {
                    onError(returnError = 'close tag, not equal to the open tag');
                    return;
                };

                // проверим что в закрываюшем теге нет лишнего
                for(; q < j; q++) {
                    w = xml.charCodeAt(q);

                    if (w === 32 || (w > 8 && w < 14)) {  // \f\n\r\t\v пробел
                        continue;
                    };

                    onError(returnError = 'close tag');
                    return;
                };

            } else {
                if (xml.charCodeAt(j - 1) ===  47) { // .../>
                    x = elem = xml.substring(i + 1, j - 1);

                    isTagStart = true;
                    isTagEnd = true;

                } else {
                    x = elem = xml.substring(i + 1, j);

                    isTagStart = true;
                    isTagEnd = false;
                };

                if (!(w > 96  && w < 123 || w > 64 && w < 91 || w === 95 || w === 58)) { // char 95"_" 58":"
                    onError(returnError = 'first char nodeName');
                    return;
                };

                for (q = 1, y = x.length; q < y; q++) {
                    w = x.charCodeAt(q);

                    if (w > 96 && w < 123 || w > 64 && w < 91 || w > 47 && w < 59 || w === 45 || w === 95) {
                        continue;
                    };

                    if (w === 32 || (w < 14 && w > 8)) { // \f\n\r\t\v пробел
                        attrRes = null; // возможно есть атирибуты
                        elem = x.substring(0, q)
                        break;
                    };

                    onError(returnError = 'invalid nodeName');
                    return;
                };

                if (!isTagEnd) {
                    nodestack.push(elem);
                };
            };


            if (isNamespace) {
                if (stop) { // потомки неизвестного пространства имен
                    if (isTagEnd) {
                        if (!isTagStart) {
                            if (--stopIndex === 0) {
                                nsmatrix = stacknsmatrix.pop();
                            };
                        };

                    } else {
                        stopIndex += 1;
                    };

                    j += 1;
                    continue;
                };

                // добавляем в stacknsmatrix только если !isTagEnd, иначе сохраняем контекст пространств в переменной
                _nsmatrix = nsmatrix;
                if (!isTagEnd) {
                    stacknsmatrix.push(nsmatrix);
                };

                if (isTagStart && (attrRes === null)) {
                    if (hasSurmiseNS = x.indexOf('xmlns', q) !== -1) { // есть подозрение на xmlns
                        attrStartPos = q;
                        attrString = x;

                        getAttrs();

                        hasSurmiseNS = false;
                    };
                };

                w = elem.indexOf(':');
                if (w !== -1) {
                    xmlns = nsmatrix[elem.substring(0, w)];
                    elem = elem.substr(w + 1);

                } else {
                    xmlns = nsmatrix.xmlns;
                };


                if (!xmlns) {
                    // элемент неизвестного пространства имен
                    if (isTagEnd) {
                        nsmatrix = _nsmatrix; // так как тут всегда isTagStart
                    } else {
                        stopIndex = 1; // первый элемент для которого не определено пространство имен
                    };

                    j += 1;
                    continue;
                };

                elem = xmlns + ':' + elem;
            };

            stringNodePosStart = i;
            stringNodePosEnd = j;

            if (isTagStart) {
                attrStartPos = q;
                attrString = x;

                onStartNode(elem, getAttrs, isTagEnd, getStringNode);
                if (parseStop) {
                    return;
                };
            };

            if (isTagEnd) {
                onEndNode(elem, isTagStart, getStringNode);
                if (parseStop) {
                    return;
                };

                if (isNamespace) {
                    if (isTagStart) {
                        nsmatrix = _nsmatrix;
                    } else {
                        nsmatrix = stacknsmatrix.pop();
                    };
                };
            };

            j += 1;
        };
    };
};
