// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const defaultConfig = getDefaultConfig(__dirname);

// Store the default resolveRequest
const defaultResolveRequest = defaultConfig.resolver.resolveRequest;

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    // Custom resolver to handle engine.io-client websocket imports
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      // Handle Node.js specific files in engine.io-client
      // Check both the realModuleName (resolved path) and moduleName (requested path)
      const checkModule = (name) => {
        if (!name || typeof name !== 'string') return false;
        // Check for .node.js files in engine.io-client
        return (
          (name.includes('engine.io-client') || name.includes('transports')) &&
          (name.includes('websocket.node.js') ||
           name.includes('polling-xhr.node.js') ||
           name.endsWith('.node.js'))
        );
      };

      if (checkModule(realModuleName) || checkModule(moduleName)) {
        // Determine which mock file to use
        let mockFileName = 'websocket.node.js';
        if (
          (realModuleName && realModuleName.includes('polling-xhr.node.js')) ||
          (moduleName && moduleName.includes('polling-xhr.node.js'))
        ) {
          mockFileName = 'polling-xhr.node.js';
        }
        
        // Redirect to mock file
        const mockPath = path.resolve(__dirname, 'mocks', mockFileName);
        return {
          type: 'sourceFile',
          filePath: mockPath,
        };
      }
      
      // Use default resolution for other modules
      if (defaultResolveRequest) {
        return defaultResolveRequest(context, realModuleName, platform, moduleName);
      }
      return context.resolveRequest(context, realModuleName, platform, moduleName);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);

// auto genrate svg icon command
//npx @svgr/cli --native "*.svg" --out-dir ../../auto-generated-svg-icons

//DebugBuild
//npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
// cd android && ./gradlew assembleDebug