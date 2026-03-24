const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin to remove 'enableBundleCompression' from build.gradle.
 * This property is deprecated and causes build failures in React Native 0.76+.
 */
function withGradleFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('enableBundleCompression')) {
      console.log('Applying Gradle fix: Removing enableBundleCompression');
      config.modResults.contents = config.modResults.contents.replace(
        /enableBundleCompression = .*/g,
        '// enableBundleCompression removed for RN 0.76+ compatibility'
      );
    }
    return config;
  });
}

module.exports = withGradleFix;
