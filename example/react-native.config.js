const path = require('path');

const project = (() => {
  try {
    const { configureProjects } = require('react-native-test-app');
    return configureProjects({
      android: {
        sourceDir: 'android',
      },
      ios: {
        sourceDir: 'ios',
        automaticPodsInstallation: true,
      },
      windows: {
        sourceDir: 'windows',
        solutionFile: 'windows/safe-area-example.sln',
      },
    });
  } catch (_) {
    return undefined;
  }
})();

module.exports = {
  ...(project ? { project } : undefined),
  dependencies: {
    'insets-test-container': {
      root: path.join(__dirname, 'insets-test-container'),
      platforms: {
        android: {
          sourceDir: path.join(__dirname, 'insets-test-container', 'android'),
          packageImportPath:
            'import com.safeareaexample.insetstest.InsetsTestContainerPackage;',
          packageInstance: 'new InsetsTestContainerPackage()',
        },
        ios: null,
        macos: null,
        windows: null,
      },
    },
  },
};
