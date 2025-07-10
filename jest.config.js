/** @returns {Promise<import('jest').Config>} */

const {createJsWithTsPreset} = require('ts-jest');

module.exports = async () => {
    return {
        verbose: true,
        rootDir: './__tests__',
        ...createJsWithTsPreset(),
    };
};