/* Native modules have no implementation under Jest; stub the ones Kru uses. */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: () => undefined,
  useCameraPermission: () => ({hasPermission: false, requestPermission: jest.fn(async () => false)}),
  useCodeScanner: config => config,
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({didCancel: true})),
  launchImageLibrary: jest.fn(async () => ({didCancel: true})),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
