use serde::Deserialize;
use tauri::{AppHandle, Runtime};
use tauri_plugin_media_session::{MediaSessionExt, MediaState};

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmtcUpdate {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub artwork_url: Option<String>,
    pub duration: Option<f64>,
    pub position: Option<f64>,
    pub is_playing: Option<bool>,
}

#[tauri::command]
pub fn smtc_update<R: Runtime>(app: AppHandle<R>, payload: SmtcUpdate) -> Result<(), String> {
    app.media_session()
        .update_state(MediaState {
            title: payload.title,
            artist: payload.artist,
            album: payload.album,
            artwork_url: payload.artwork_url,
            duration: payload.duration,
            position: payload.position,
            is_playing: payload.is_playing,
            can_prev: Some(true),
            can_next: Some(true),
            can_seek: Some(true),
            ..Default::default()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn smtc_clear<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.media_session().clear().map_err(|e| e.to_string())
}
