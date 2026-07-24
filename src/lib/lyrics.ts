export interface LyricLine {
    time: number
    text: string
}

/** Parse standard LRC format: [mm:ss.xx]lyric text */
export function parseLrc(lrc: string): LyricLine[] {
    const lines: LyricLine[] = []
    const regex = /\[(\d{2}):(\d{2})[:.](\d{2,3})\](.*)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(lrc)) !== null) {
        const min = parseInt(match[1])
        const sec = parseInt(match[2])
        const ms = parseInt(match[3].padEnd(3, "0"))
        const time = min * 60 + sec + ms / 1000
        const text = match[4].trim()
        if (text) lines.push({ time, text })
    }
    return lines.sort((a, b) => a.time - b.time)
}

/** Find the index of the current lyric line based on playback time */
export function getCurrentLine(lyrics: LyricLine[], time: number): number {
    for (let i = lyrics.length - 1; i >= 0; i--) {
        if (lyrics[i].time <= time) return i
    }
    return -1
}
