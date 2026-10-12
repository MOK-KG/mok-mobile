// SVG подключаются как ассеты Metro и рисуются через expo-image
declare module '*.svg' {
  const source: number;
  export default source;
}
