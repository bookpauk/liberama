import WebSocketConnection from '../../server/core/WebSocketConnection';

const indexFile = 'index.html';
const loc = window.location;

const protocol = (loc.protocol == 'https:' ? 'wss:' : 'ws:');
let pathname = loc.pathname;
if (pathname.endsWith(indexFile))
    pathname = pathname.substring(0, -indexFile.length);

let url = `${protocol}//${loc.host}${pathname}`;
url += (url[url.length - 1] === '/' ? 'ws' : '/ws');

export default new WebSocketConnection(url);