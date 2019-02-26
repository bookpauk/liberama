const detect = require('detect-file-type');

//html
detect.addSignature(
  {
    "type": "html",
    "ext": "html",
    "mime": "text/html",
    "rules": [
      { "type": "or", "rules":
      [
        { "type": "equal", "end": 5, "bytes": "3c68746d6c" },
        { "type": "equal", "end": 10, "bytes": "3c00680074006d006c00" },

        { "type": "equal", "end": 9, "bytes": "3c21646f6374797065" },
        { "type": "equal", "end": 5, "bytes": "3c626f6479" },
        { "type": "equal", "end": 5, "bytes": "3c68656164" },
        { "type": "equal", "end": 7, "bytes": "3c696672616d65" },
        { "type": "equal", "end": 4, "bytes": "3c696d67" },
        { "type": "equal", "end": 7, "bytes": "3c6f626a656374" },
        { "type": "equal", "end": 7, "bytes": "3c736372697074" },
        { "type": "equal", "end": 6, "bytes": "3c7461626c65" },
        { "type": "equal", "end": 6, "bytes": "3c7469746c65" },
      ]
      }
    ]
  }
);

//xml 3c 3f 78 6d 6c 20 76 65 72 73 69 6f 6e 3d 22 31 2e 30 22
detect.addSignature(
  {
    "type": "xml",
    "ext": "xml",
    "mime": "application/xml",
    "rules": [
      { "type": "or", "rules":
      [
        { "type": "equal", "end": 19, "bytes": "3c3f786d6c2076657273696f6e3d22312e3022" },
      ]
      }
    ]
  }
);

class FileDetector {
    detectFile(filename) {
        return new Promise((resolve, reject) => {
            detect.fromFile(filename, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }
}

module.exports = FileDetector;