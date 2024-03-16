const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directly include the list of module paths you want to build.
const modules = [
  './node_modules/wikibase-edit/lib/index.js',
  // './node_modules/another-module/path/to/file.js',
  // Add more modules as needed.
];

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'importmap');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

modules.forEach(modulePath => {
  // Extracts the module name from the path, assuming the module name is the first directory in the path.
  const moduleName = modulePath.split('/')[2]; // Adjusted to capture the actual module name.
  const outputPath = path.join(outputDir, `${moduleName}.mjs`);

  // esbuild command, assuming esbuild is installed locally in the project.
  const command = `./node_modules/.bin/esbuild ${modulePath} --bundle --outfile=${outputPath} --platform=browser --format=esm`;

  // Execute the esbuild command
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error building ${moduleName} with esbuild:`, error);
      return;
    }
    if (stderr) {
      console.error(`esbuild stderr for ${moduleName}:`, stderr);
      return;
    }
    console.log(`Built ${moduleName}.mjs successfully with esbuild.`);
  });
});
