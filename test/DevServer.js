import http from "http"
import test from "tape"
import DevServer from "../DevServer"

const port = 8000
const host = "localhost"

function newDevServer(t) {
	const devserver = new DevServer()
	devserver.on("error", t.end)
	return new Promise(resolve => devserver.listen(port, host, () => resolve(devserver)))
}

test("devserver starts", async t => {
	const srv = await newDevServer(t)
	srv.close(t.end)
})

test("devserver serves files", async t => {
	const srv = await newDevServer(t)
	const paths = [ "/", "/index.css", "/agendadulibre.js" ]
	t.plan(paths.length)
	for (const path of paths) {
		try {
			const res = await asyncGet(`http://localhost:${port}${path}`)
			t.ok(res.text())
		} catch(err) {
			t.fail(err)
		}
	}
	srv.close(t.end)
})

test("devserver API endpoint returns valid JSON", async t => {
	const srv = await newDevServer(t)
	let err
	try {
		const data = await asyncGet(`http://localhost:${port}/_api/agendadulibre`)
		const events = data.json()
		t.ok(events instanceof Array)
		t.ok(events.length)
	} catch(e) {
		err = e
	} finally {
		srv.close(() => t.end(err))
	}
})

test("devserver API returns events with the correct keys", async t => {
	const keys = ["address", "city", "region_id", "start_time", "end_time", "description",
		"tags", "url", "contact", "title", "id", "place_name", "locality"]
	keys.sort()
	const srv = await newDevServer(t)
	let err
	try {
		const data = await asyncGet(`http://localhost:${port}/_api/agendadulibre`)
		const events = data.json()
		t.plan(events.length)
		for (const event of events)
			t.deepEqual(Object.getOwnPropertyNames(event).sort(), keys)
	} catch(e) {
		err = e
	} finally {
		srv.close(() => t.end(err))
	}
})

test("devserver API endpoint returns dates of a specific year", async t => {
	const years = [ 2017, 2016, 2018 ]
	const srv = await newDevServer(t)
	let err
	for (const year of years) {
		try {
			const response = await asyncGet(`http://localhost:${port}/_api/agendadulibre?period[year]=${year}`)
			const events = response.json()
			for (const event of events) {
				const start_time = new Date(event.start_time)
				t.equal(start_time.getFullYear(), year)
			}
		} catch(e) {
			err = e
			break
		}
	}
	srv.close(() => t.end(err))
})

function asyncGet(url) {
	let data = ""
	return new Promise((resolve, reject) => {
		http.get(url, res => {
			res.on("data", chunk => data += chunk.toString())
			res.on("end", () => resolve({
				// Imitates the fetch API.
				text() { return data },
				json() { return JSON.parse(data) }
			}))
			res.on("error", reject)
		}).on("error", reject)
	})
}
