/** @returns {Promise<import('jest').Config>} */
const {pathsToModuleNameMapper, createJsWithTsEsmPreset} = require('ts-jest');
const {compilerOptions} = require('./tsconfig.json');

module.exports = () => {
    return {
        verbose: true,
        rootDir: './src',
        moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: __dirname }),
        ...createJsWithTsEsmPreset(),
    };
};