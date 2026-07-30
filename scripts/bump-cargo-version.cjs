const fs = require("fs")
const path = require("path")

const cargoPath = path.resolve(__dirname, "../src-tauri/Cargo.toml")
const version = process.argv[2]

console.log("cargoPath:", cargoPath)
console.log("target version:", version)
console.log("file exists:", fs.existsSync(cargoPath))

if (!version) {
    console.error("No version provided")
    process.exit(1)
}

let content = fs.readFileSync(cargoPath, "utf8")
const before = content
// 匹配 version = "xxx"，不管后面有没有注释
content = content.replace(/^(version\s*=\s*)"[^"]*"/m, `$1"${version}"`)
console.log("changed:", content !== before)
console.log("before:", before.split("\n")[2])
console.log("after:", content.split("\n")[2])

fs.writeFileSync(cargoPath, content, "utf8")
console.log("write done")
