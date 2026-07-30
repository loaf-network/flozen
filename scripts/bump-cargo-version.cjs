const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const cargoPath = path.resolve(__dirname, "../src-tauri/Cargo.toml")
const version = process.argv[2]

if (!version) {
    console.error("No version provided")
    process.exit(1)
}

let content = fs.readFileSync(cargoPath, "utf8")
content = content.replace(/^(version\s*=\s*)"[^"]*"/m, `$1"${version}"`)
fs.writeFileSync(cargoPath, content, "utf8")
console.log(`Cargo.toml version -> ${version}`)

try {
    execSync("cargo check --quiet", {
        cwd: path.resolve(__dirname, "../src-tauri"),
        stdio: "ignore",
    })
    console.log("Cargo.lock updated")
} catch {
    console.warn("cargo check failed, Cargo.lock not updated")
}
