const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const copyModules = {
  'binary-variations': './node_modules/binary-variations/index.js',
  'preact-hooks': './node_modules/preact/hooks/dist/hooks.module.js',
  'wikibase-sdk': './node_modules/wikibase-sdk/dist/src/wikibase-sdk.js',
  htm: './importmap/htm.mjs',
  isbn3: './node_modules/isbn3/isbn.js',
  preact: './node_modules/preact/dist/preact.mjs',
  leaflet: './node_modules/leaflet/dist/leaflet.js',
};

const copyStylesheets = {
  normalize: './node_modules/normalize.css/normalize.css',
  leaflet: './node_modules/leaflet/dist/leaflet.css',
};

const outputDir = path.join(__dirname, 'importmap');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const execute = (command, what) => {
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing setuo command`, error);
      return;
    }
    if (stderr) {
      console.error(`esbuild stderr for ${what}:`, stderr);
      return;
    }
    console.log(`Prepared ${what} successfully.`);
  });
};

function copyFileAndReplaceString(
  srcPath,
  destPath,
  searchString,
  replaceString,
  callback,
) {
  fs.readFile(srcPath, 'utf8', (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    const result = data.replace(searchString, replaceString);

    fs.writeFile(destPath, result, 'utf8', err => {
      if (err) {
        callback(err);
        return;
      }

      callback(null, 'The file has been copied and modified successfully.');
    });
  });
}

Object.keys(copyModules).forEach(moduleName => {
  const outputPath = path.join(outputDir, `${moduleName}.mjs`);

  copyFileAndReplaceString(
    copyModules[moduleName],
    outputPath,
    '"preact"',
    '"./preact.mjs"',
    (err, message) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(message);
      }
    },
  );
});

Object.keys(copyStylesheets).forEach(moduleName => {
  const outputPath = path.join(outputDir, `${moduleName}.css`);

  copyFileAndReplaceString(
    copyStylesheets[moduleName],
    outputPath,
    '',
    '',
    (err, message) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(message);
      }
    },
  );
});
