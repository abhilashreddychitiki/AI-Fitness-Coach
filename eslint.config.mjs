import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "presentation/**"]
  },
  ...nextVitals,
  ...nextTypescript
];

export default config;
