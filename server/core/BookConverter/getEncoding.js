function getEncoding(str) {
        const lowerCase = 3;
        const upperCase = 1;

        const codePage = {
            'k': 'koi8-r',
            'w': 'Windows-1251',
            'd': 'cp866',
            'i': 'ISO-8859-5',
            'm': 'maccyrillic',
        };

        let charsets = {
            'k': 0,
            'w': 0,
            'd': 0,
            'i': 0,
            'm': 0
        };

        const len = str.len;
        const blockSize = (len > 5*3000 ? 3000 : len);
        let counter = 0;
        let i = 0;
        while (i < len) {
            const char = str.charCodeAt(i);

            //non-russian characters
            if (char < 128 || char > 256)
                continue;

            //CP866
            if ((char > 159 && char < 176) || (char > 223 && char < 242)) charsets['d'] += lowerCase;
            if ((char > 127 && char < 160)) charsets['d'] += upperCase;

            //KOI8-R
            if ((char > 191 && char < 223)) charsets['k'] += lowerCase;
            if ((char > 222 && char < 256)) charsets['k'] += upperCase;

            //WIN-1251
            if (char > 223 && char < 256) charsets['w'] += lowerCase;
            if (char > 191 && char < 224) charsets['w'] += upperCase;

            //MAC
            if (char > 221 && char < 255) charsets['m'] += lowerCase;
            if (char > 127 && char < 160) charsets['m'] += upperCase;

            //ISO-8859-5
            if (char > 207 && char < 240) charsets['i'] += lowerCase;
            if (char > 175 && char < 208) charsets['i'] += upperCase;

            counter++;

            if (counter > blockSize) {
                counter = 0;
                i += Math.round(len/2 - 2*blockSize);
            }
            i++;
        }

        let sorted = Object.keys(charsets).map(function(key) {
            return { codePage: codePage[key], c: charsets[key] };
        });

        sorted.sort((a, b) => a.c - b.c);

        return sorted[0].codePage;
    }

module.exports = getEncoding;