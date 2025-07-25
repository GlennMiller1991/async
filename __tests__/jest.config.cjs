/** @returns {Promise<import('jest').Config>} */
const {pathsToModuleNameMapper, createJsWithTsEsmPreset} = require('ts-jest');
const {compilerOptions} = require('./tsconfig.json');

const targetVersion = [22, 17, 8];

const currentVersion = process.version
    .split('.')
    .map(Number);

for (let i = 0; i < targetVersion.length; i++) {
    if (targetVersion[i] < currentVersion[i]) {
        console.warn(`The current version (${process.version}) is older than target`);
        break;
    }
}


module.exports = () => {
    return {
        verbose: true,
        rootDir: './src',
        moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: __dirname }),
        ...createJsWithTsEsmPreset(),
    };
};