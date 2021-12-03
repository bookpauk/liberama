//TODO: удалить модуль в 2023г
const fs = require('fs-extra');
const log = new (require('../core/AppLogger'))().log;//singleton

class Converter {    
    async run(config) {        
        log('Converter start');

        try {
            const connManager = new (require('./ConnManager'))();//singleton
            const storagePool = connManager.pool.readerStorage;

            const jembaConnManager = new (require('./JembaConnManager'))();//singleton
            const db = jembaConnManager.db['reader-storage'];

            const srcDbPath = `${config.dataDir}/reader-storage.sqlite`;
            if (!await fs.pathExists(srcDbPath)) {
                log(LM_WARN, '  Source DB does not exist, nothing to do');
                return;
            }

            const rows = await db.select({table: 'storage', count: true});
            if (rows.length && rows[0].count != 0) {
                log(LM_WARN, `  Destination table already exists (found ${rows[0].count} items), nothing to do`);
                return;
            }

            const dbSrc = await storagePool.get();
            try {
                const rows = await dbSrc.all(`SELECT * FROM storage`);
                await db.insert({table: 'storage', rows});
                log(`  Inserted ${rows.length} items`);
            } finally {
                dbSrc.ret();
            }
        } finally {
            log('Converter finish');
        }
    }
}

module.exports = Converter;