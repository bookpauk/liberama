const fs = require('fs-extra');

async function main() {
    const webfonts = await fs.readFile('webfonts.json');
    let fonts = JSON.parse(webfonts);

    fonts = fonts.items.filter(item => item.subsets.includes('cyrillic'));
    fonts = fonts.map(item => item.family);
    fonts.sort();

    await fs.writeFile('fonts.json', JSON.stringify(fonts));
}
main();