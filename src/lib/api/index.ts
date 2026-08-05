// ─── Unified types ───

export interface Song {
    id: number
    name: string
    artists: { id: number; name: string }[]
    album: { id: number; name: string; picUrl: string }
    duration: number
    provider: "ncm"
}

// ─── Re-export NCM ───

export type {
    QrKeyRes,
    QrCreateRes,
    QrCheckRes,
    UserProfile,
    UserAccountRes,
    SearchRes,
    SearchSong,
    SearchSuggestRes,
    SearchHotRes,
    SongUrlRes,
    LyricRes,
    SongDetailRes,
    PlaylistSimple,
    PlaylistDetailRes,
    UserPlaylistRes,
    PlaylistCreateRes,
    LikeRes,
    LikeListRes,
    VipInfoRes,
    ToplistItem,
    ToplistRes,
    ScrobbleRes,
    SubmitPlayStateRes,
} from "./ncm"

export {
    getQrKey,
    createQr,
    checkQr,
    ncmLogout,
    getNcmAccount,
    ncmSearch,
    ncmSearchSuggest,
    ncmSearchHot,
    ncmSongUrl,
    ncmLyric,
    ncmSongDetail,
    ncmLikeSong,
    ncmLikelist,
    ncmVipInfo,
    ncmUserPlaylist,
    ncmPlaylistDetail,
    ncmPlaylistTracks,
    ncmCreatePlaylist,
    ncmDeletePlaylist,
    ncmPlaylistTracksOp,
    ncmToplist,
    ncmScrobble,
    ncmSubmitPlayState,
} from "./ncm"
