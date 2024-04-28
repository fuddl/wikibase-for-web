const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const copyModules = {
  isbn3: './node_modules/isbn3/isbn.js',
  'preact-hooks': './node_modules/preact/hooks/dist/hooks.module.js',
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
    '"../node_modules/preact/dist/preact.mjs"',
    (err, message) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(message);
      }
    },
  );
});
