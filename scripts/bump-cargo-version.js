const fs = require("fs")
const path = require("path")

const cargoPath = path.resolve(__dirname, "../src-tauri/Cargo.toml")
const version = process.env.npm_package_version || process.argv[2]

if (!version) {
    console.error("No version provided")
    process.exit(1)
}

let content = fs.readFileSync(cargoPath, "utf8")
content = content.replace(/^version = ".*"$/m, `version = "${version}"`)
fs.writeFileSync(cargoPath, content)
console.log(`Cargo.toml version updated to ${version}`)
