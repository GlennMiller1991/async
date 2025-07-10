/** @returns {Promise<import('jest').Config>} */

const {createJsWithTsPreset} = require('ts-jest');

module.exports = async () => {
    return {
        verbose: true,
        rootDir: './src',
        ...createJsWithTsPreset(),
    };
};