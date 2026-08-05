import { reactive } from "vue"
import type { SearchSong } from "./api"

// 搜索页状态单例：路由切换（组件卸载/重建）后保留搜索结果，
// 重新进入搜索页时可直接接续上次的关键词、结果与分页位置
export interface SearchState {
    query: string
    results: SearchSong[]
    suggests: SearchSong[]
    hotTags: { first: string; second: number }[]
    searched: boolean
    offset: number
    hasMore: boolean
    scrollTop: number
}

export const searchState = reactive<SearchState>({
    query: "",
    results: [],
    suggests: [],
    hotTags: [],
    searched: false,
    offset: 0,
    hasMore: true,
    scrollTop: 0,
})
