import async_to_gen from "rollup-plugin-async"
import cleanup from "rollup-plugin-cleanup"

export default {
	plugins: [ async_to_gen(), cleanup() ],
	output: {name: "agendadulibre"},
	external: [ "http", "fs", "url", "stream", "tape" ]
}
