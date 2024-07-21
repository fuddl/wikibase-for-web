const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

// Define the source and destination directories
const srcDir = path.join(__dirname, 'node_modules');
const destDir = path.join(__dirname, 'importmap');

// List of modules to copy
const modulesToCopy = [
  'binary-variations',
  'htm',
  'isbn3',
  'leaflet',
  'normalize.css',
  'preact',
  'wikibase-sdk',
  '@sutton-signwriting',
];

async function copySpecifiedModules() {
  try {
    // Ensure the destination directory exists
    await fs.ensureDir(destDir);

    // Copy each specified module if it exists in node_modules
    for (let moduleName of modulesToCopy) {
      const srcPath = path.join(srcDir, moduleName);
      const destPath = path.join(destDir, moduleName);

      // Check if the source path exists and is a directory
      if (
        (await fs.pathExists(srcPath)) &&
        (await fs.stat(srcPath)).isDirectory()
      ) {
        // Copy the module directory to the destination
        await fs.copy(srcPath, destPath);
        console.log(`Copied '${moduleName}' to importmap directory.`);
      } else {
        console.log(
          `Module '${moduleName}' does not exist or is not a directory.`,
        );
      }
    }

    console.log('Specified modules have been copied successfully.');
  } catch (err) {
    console.error('Error copying modules:', err);
  }
}

// Allowed file extensions
const allowedExtensions = new Set([
  '.css',
  '.js',
  '.mjs',
  '.png',
  '.svg',
  '.json',
  '.md',
]);

async function deleteDisallowedFiles(directory) {
  try {
    // Read all files and directories in the current directory
    const items = await fs.readdir(directory);

    for (let item of items) {
      const itemPath = path.join(directory, item);
      const itemStat = await fs.stat(itemPath);

      if (itemStat.isDirectory()) {
        // If the item is a directory, recurse into it
        await deleteDisallowedFiles(itemPath);
      } else {
        // If the item is a file, check the extension
        const ext = path.extname(item);

        if (!allowedExtensions.has(ext)) {
          await fs.remove(itemPath);
          console.log(`Deleted '${itemPath}' - disallowed extension.`);
        }
      }
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

/**
 * Opens a file, replaces specified content, and saves it back.
 *
 * @param {string} filePath - The path to the file.
 * @param {RegExp} searchValue - The regular expression to match content to replace.
 * @param {string} replaceValue - The string to replace the matched content with.
 */
function modifyFile(filePath, searchValue, replaceValue) {
  // Read the file asynchronously
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Replace the content
    const modifiedData = data.replace(searchValue, replaceValue);

    // Save the modified file back
    fs.writeFile(filePath, modifiedData, 'utf8', err => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File has been modified and saved successfully.');
      }
    });
  });
}
async function fixImportExport(directory) {
  try {
    const pattern = '**/*.js'; // Pattern to match all JS files
    const options = {
      cwd: directory,
      ignore: 'node_modules/**', // Ignoring node_modules directory
    };

    const files = await glob(pattern, options);

    for (let file of files) {
      const fullPath = path.join(directory, file);
      const data = await fs.readFile(fullPath, 'utf8');

      // Regex to modify import and export paths that lack a '.js' extension, supporting `* as Alias` and multiline
      const regex =
        /(import\s+(?:\* as \S+,\s*)?(?:[\s\S]*?)from\s+|export\s+(?:\*|{[\s\S]*?})\s+from\s+)['"]([^'"\s]+?)['"];?/gm;
      const fixedData = data.replace(regex, (match, prefix, filepath) => {
        if (
          !filepath.endsWith('.js') &&
          !filepath.startsWith('http') &&
          !filepath.includes('.json')
        ) {
          return `${prefix}'${filepath}.js';`;
        }
        return match;
      });

      if (data !== fixedData) {
        await fs.writeFile(fullPath, fixedData, 'utf8');
        console.log(`Updated imports/exports in file ${fullPath}`);
      }
    }
  } catch (err) {
    console.error('Error processing files:', err);
  }
}

(async () => {
  // Run the copy operation
  await copySpecifiedModules();

  // Run the cleanup function
  await deleteDisallowedFiles(destDir);

  modifyFile(
    './importmap/preact/hooks/src/index.js',
    "'preact'",
    '"../../src/index.js"',
  );
  modifyFile(
    './importmap/leaflet/src/Leaflet.js',
    "import {version} from '../package.json';",
    "const version = '1.9.4';",
  );

  await fixImportExport(path.join(__dirname, 'importmap'));
})();
