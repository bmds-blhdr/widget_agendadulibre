import { Server } from "http"
import fs from "fs"
import { Transform } from "stream"
import URL from "url"
import IsoDate from "./src/IsoDate"

export default class DevServer extends Server {
	constructor(...args) {
		super(...args)
		this.on("request", this.router.bind(this))
	}

	router(req, res) {
		console.log(req.method + " " + decodeURI(req.url))
		if (req.method !== "GET")
			console.error(`Wrong HTTP verb: ${req.method} instead of GET.`)
		const url = req.url.replace(/\?.*$/, "")
		switch (url) {
			case "/":
				this.index(req, res)
				break
			case "/index.css":
				this.css(req, res)
				break
			case "/agendadulibre.js":
				this.adl_script(req, res)
				break
			case "/_api/agendadulibre":
				this.adl_api(req, res)
				break
			default:
				res.writeHead(404, {"Content-Type": "text/html"})
				res.end("Not found.")
		}
	}

	index(req, res) {
		const filter = chunk => chunk.toString().replace("${port}", this.address().port)
		fs.createReadStream("./index.html")
			.pipe(through(filter))
			.pipe(res)
	}

	css(req, res) {
		res.writeHead(200, {"Content-Type": "text/css"})
		fs.createReadStream("./index.css").pipe(res)
	}

	adl_script(req, res) {
		res.writeHead(200, {"Content-Type": "application/javascript"})
		fs.createReadStream("./dist/agendadulibre.js").pipe(res)
	}

	adl_api(req, res) {
		const url = URL.parse(req.url, true)
		const nb_events = random(3, 20)
		res.writeHead(200, {"Content-Type": "application/json"})
		res.write("[")
		for (let i = 0; i < nb_events; i++) {
			res.write(JSON.stringify(this.make_event(url.query, i)))
			if (i < nb_events - 1)
				res.write(",")
		}
		res.end("]")
	}

	make_event(parameters, id) {
		const tags = [ "ubuntu", "logiciels-libres", "atelier", "install-party",
			"internet", "openstreetmap", "gnu-linux", "linux"]

		let location = parameters["near[location]"]
		let week = parameters["period[week]"]
		let region = parameters["region"] || random(1, 10)
		let date
		let year
		if ("period[year]" in parameters) {
			year = parameters["period[year]"]
			date = new IsoDate(year)
		} else {
			date = new IsoDate()
			year = date.getFullYear()
		}

		/*
		 * Events are built so as to hold information about
		 * what parameters were passed to the server. Adding
		 * the actual parameters as a value is tempting but
		 * might break code expecting no more keys than what
		 * should be in the response.
		 */
		if ("near[distance]" in parameters && typeof location !== "undefined")
			location += ` ± ${parameters["near[distance]"]}km`
		const event = {
			id: id,
			title: `<Title #${id}>`,
			description: `<Description #${id}>`,
			place_name: `<Place Name #${id}>`,
			city: location || "<City>",
			address: `<Address #${id}>`,
			region_id: region,
			locality: random(1, 99),
			url: "http://example.org/",
			contact: "contact@example.org",
			tags: [],
		}
		date.setDate(date.getDate() + random(0, 20))
		if (typeof week !== "undefined")
			date.setWeek(week)
		event.start_time = date.toISOString()
		date.setHours(date.getHours() + random(1, 48))
		event.end_time = date.toISOString()
		const nb_tags = random(1, 10)
		for (let i = 0; i < nb_tags; i++)
			event.tags.push({
				id: random(0, 1000000),
				name: tags[random(0, tags.length - 1)],
				taggings_count: random(1, 1000)
			})

		return event
	}
}

function random(min, max) {
	return Math.trunc(Math.random() * (max - min) + min + 1)
}

function through(filter) {
	return new Transform({
		transform(chunk, enc, next) {
			next(null, filter(chunk, enc))
		}
	})
}
