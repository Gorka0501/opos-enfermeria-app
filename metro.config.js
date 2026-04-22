const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Necesario para resolver expo-file-system/legacy (el campo exports usa subpaths)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
