import http from "http"
import test from "tape"
import DevServer from "../DevServer"

const port = 8000
let devserver

test.onFinish(() => devserver.close())

test("devserver starts", t => {
	try {
		devserver = new DevServer()
	} catch(err) {
		t.end(err)
	}
	devserver.on("error", err => t.end(err))
	devserver.listen(port, () => t.end())
})

test("devserver serves files", async t => {
	const paths = [ "/", "/index.css", "/agendadulibre.js" ]
	t.plan(paths.length)
	for (const path of paths) {
		try {
			const res = await asyncGet(`http://localhost:${port}${path}`)
			t.ok(res)
		} catch(err) {
			t.fail(err)
		}
	}
})

test("devserver API endpoint returns valid JSON", async t => {
	try {
		const raw = await asyncGet(`http://localhost:${port}/_api/agendadulibre`)
		const data = JSON.parse(raw)
		t.ok(data instanceof Array)
		t.ok(data.length)
		t.end()
	} catch(err) {
		t.end(err)
	}
})

test("devserver API returns events with the correct keys", async t => {
	const keys = ["address", "city", "region_id", "start_time", "end_time", "description",
		"tags", "url", "contact", "title", "id", "place_name", "locality"]
	keys.sort()
	try {
		const raw = await asyncGet(`http://localhost:${port}/_api/agendadulibre`)
		const events = JSON.parse(raw)
		t.plan(events.length)
		for (const event of events)
			t.deepEqual(Object.getOwnPropertyNames(event).sort(), keys)
	} catch(err) {
		t.end(err)
	}
})

function asyncGet(url) {
	let data = ""
	return new Promise((resolve, reject) => {
		http.get(url, res => {
			res.on("data", chunk => data += chunk.toString())
			res.on("end", () => resolve(data))
			res.on("error", reject)
		}).on("error", reject)
	})
}
