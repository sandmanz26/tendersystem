module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest/setup.js'],
  setupFilesAfterEnv: ['./jest/after-env.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|lucide-react-native|react-native-svg|react-native-safe-area-context)/)',
  ],
};
