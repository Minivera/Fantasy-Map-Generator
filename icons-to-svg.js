/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require('node:fs/promises');
const path = require('path');

const { parse, stringify } = require('svgson');

const main = async () => {
  const data = await fs.readFile('./src/assets/icons.svg', {
    encoding: 'utf8',
  });

  const svgStructure = await parse(data);
  // First attribute is an `svg` node followed by a `g` node.
  const symbols = svgStructure.children[0].children;

  const pathToIcons = path.resolve('./src/assets/icons');
  return Promise.all(
    symbols.map(async symbol => {
      const filename = path.join(pathToIcons, symbol.attributes.id + '.svg');

      // each child of the `g` node is a symbol, we need to convert it to a svg
      symbol.name = 'svg';
      symbol.attributes.xmlns = 'http://www.w3.org/2000/svg';
      delete symbol.attributes.id;

      await fs.writeFile(filename, stringify(symbol));
    })
  );
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
