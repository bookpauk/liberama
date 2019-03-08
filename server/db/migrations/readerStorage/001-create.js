module.exports = `
-- Up
CREATE TABLE storage (id TEXT PRIMARY KEY, rev INTEGER, data TEXT);

-- Down
DROP TABLE storage;
`;