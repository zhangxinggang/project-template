declare module 'merge' {
  const merge: {
    recursive: <T extends object, U extends object>(target: T, source: U) => T & U;
  };

  export = merge;
}
