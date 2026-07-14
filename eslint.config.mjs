import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** Native flat config — avoids FlatCompat circular JSON crash with ESLint 9. */
const eslintConfig = [...nextCoreWebVitals, ...nextTypescript];

export default eslintConfig;
