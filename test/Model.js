import test from "tape"
import { Model } from "../src/agendadulibre"

test("Model#fetch correctly parses received data", async t => {
	const fake_data = [{
		id: 1,
		title: "title",
		description: "description",
		place_name: "place name",
		city: "city",
		address: "address",
		region_id: "region",
		locality: "locality",
		url: "http://example.org/",
		contact: "contact@example.org",
		tags: [{id: 2, name: "tag", taggings_count: 10}],
		start_time: "2017-01-26T12:00:00.000Z",
		end_time: "2017-01-26T18:00:00.000Z",
	}]

	const fakeResponse = {
		json() { return fake_data },
		text() { return JSON.stringify(fake_data) }
	}
	const fakeFetch = () => fakeResponse

	try {
		const model = new Model("http://host/path", {}, fakeFetch)
		await model.fetch()
		t.deepEqual(model.events, fake_data)
		t.end()
	} catch(err) {
		t.end(err)
	}
})

test("Model#parameters gets correctly parsed year and week", t => {
	const parameters = {
		year: "current + 1",
		week: "current - 1",
	}
	let model
	try {
		model = new Model("http://host/path", parameters)
	} catch(err) {
		t.end(err)
	}
	const date = model.date
	const expected = new Map([
		["year", date.getFullYear() + 1],
		["week", date.getWeek() - 1]
	])
	t.deepEqual(model.parameters, expected)
	t.end()
})

test("Model#fetch sends correct urls (order and formatting)", async t => {
	const parameters = {
		year: 2017,
		week: 4,
		location: "Tours",
		distance: 20,
		region: 7
	}
	let expected_url = "http://host/path"
		+ "?period[year]=2017"
		+ "&period[week]=4"
		+ "&near[location]=Tours"
		+ "&near[distance]=20"
		+ "&region=7"

	let sent_url
	const fakeFetch = url => sent_url = url
	try {
		const model = new Model("http://host/path", parameters, fakeFetch)
		// It won't get an actual object; let it throw, we only care about the sent url.
		try {
			await model.fetch()
		}
		catch(ignore) {}
		t.equal(sent_url, expected_url)
		t.end()
	} catch(err) {
		t.end(err)
	}
})
