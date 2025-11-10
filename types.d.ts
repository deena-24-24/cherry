declare module '*.svg' {
  const src: string
  export default src
}



// Avoid duplicate redeclare in some toolchains
// declare const __webpack_public_path__: string