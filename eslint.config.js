import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import prettier from "eslint-config-prettier"

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        ignores: ["src-tauri/**", "dist/**", "node_modules/**", ".agents/**", "prompts/**"],
    },
    // Node 脚本（.cjs）按 CommonJS/Node 环境检查，避免 require/process 等误报
    {
        files: ["**/*.cjs"],
        languageOptions: {
            globals: {
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                console: "readonly",
                Buffer: "readonly",
                global: "readonly",
                setImmediate: "readonly",
                clearImmediate: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
)
