import DevServer from "./DevServer"

const port = process.argv[2] || 8000
const host = process.argv[3] || "localhost"

const srv = new DevServer()
srv.on("listening", () => {
	console.log(`Listening on port ${port}, host ${host}.`)
})
srv.listen({port, host})
