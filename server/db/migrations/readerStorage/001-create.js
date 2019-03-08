module.exports = `
-- Up
CREATE TABLE storage (id2 INTEGER PRIMARY KEY, name TEXT);

-- Down
DROP TABLE storage;
`;