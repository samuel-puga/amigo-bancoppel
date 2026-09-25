#!/usr/bin/env node
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const PORT = parseInt(process.env.MOBILE_SERVE_PORT || "8080", 10)

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  let filePath = path.join(rootDir, "dist", req.url.split("?")[0])
  if (req.url === "/" || req.url === "") {
    const singleFile = path.join(rootDir, "dist", "index.singlefile.html")
    filePath = fs.existsSync(singleFile)
      ? singleFile
      : path.join(rootDir, "dist", "index.html")
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" })
    res.end("404 Not Found")
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || "application/octet-stream"
  const stat = fs.statSync(filePath)

  // Video range support for streaming
  if (req.headers.range && ext === ".mp4") {
    const range = req.headers.range
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunksize = end - start + 1
    const file = fs.createReadStream(filePath, { start, end })
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    })
    file.pipe(res)
    return
  }

  res.writeHead(200, {
    "Content-Length": stat.size,
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
  })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[ServeMobile] Local static server running at http://localhost:${PORT}`,
  )
  console.log(`[ServeMobile] Serving dist/index.singlefile.html`)
})
