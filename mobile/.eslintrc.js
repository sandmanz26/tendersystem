module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Formatting is prettier's job; inline styles are deliberate for one-off layout.
    'prettier/prettier': 'off',
    quotes: 'off',
    semi: 'off',
    'react-native/no-inline-styles': 'off',
    curly: 'off',
  },
};
