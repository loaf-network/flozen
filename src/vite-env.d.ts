/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_NCM_BASE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module "*.vue" {
    import type { DefineComponent } from "vue"
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
    const component: DefineComponent<{}, {}, any>
    export default component
}
