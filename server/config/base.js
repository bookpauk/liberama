const path = require('path');
const pckg = require('../../package.json');

const execDir = path.resolve(__dirname, '..');
const dataDir = `${execDir}/data`;

module.exports = {
    branch: 'unknown',
    version: pckg.version,
    name: pckg.name,

    dataDir: dataDir,
    tempDir: `${dataDir}/tmp`,
    logDir: `${dataDir}/log`,
    publicDir: `${execDir}/public`,
    uploadDir: `${execDir}/public/upload`,
    sharedDir: `${execDir}/public/shared`,
    loggingEnabled: true,

    maxUploadFileSize: 50*1024*1024,//50Мб
    maxTempPublicDirSize: 512*1024*1024,//512Мб + 20% квота если проблема с remoteWebDavStorage
    maxUploadPublicDirSize: 200*1024*1024,//100Мб

    useExternalBookConverter: false,
    acceptFileExt: '.fb2, .fb3, .html, .txt, .zip, .bz2, .gz, .rar, .epub, .mobi, .rtf, .doc, .docx, .pdf, .djvu, .jpg, .jpeg, .png',
    webConfigParams: ['name', 'version', 'mode', 'maxUploadFileSize', 'useExternalBookConverter', 'acceptFileExt', 'branch'],

    jembaDb: [
        {
            dbName: 'app',
            thread: true,
            openAll: true,
        },
        {
            dbName: 'reader-storage',
            thread: true,
            openAll: true,
        }
    ],

    servers: [
        {
            serverName: '1',
            mode: 'normal', //'none', 'normal', 'site', 'reader', 'omnireader', 'liberama.top', 'book_update_checker'
            ip: '0.0.0.0',
            port: '33080',
        },
    ],

    remoteStorage: false,
    /*
    remoteStorage: {
        url: 'https://127.0.0.1:11900',
        accessToken: '',
    },
    */
};

