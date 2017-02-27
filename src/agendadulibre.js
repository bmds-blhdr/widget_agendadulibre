import IsoDate from "./IsoDate"
import fetch from "./fetch"

export const version = "1.0.0"

// Can be called with the following:
//	document.addEventListener("DOMContentLoaded", () => run("http://localhost:800/_api/agendadulibre"))
// The view is (optionally) passed first after the url so as to make easier to use a modified view class.
export function run(url, view=View, model=Model, controller=Controller) {
	const elements = document.getElementsByClassName("agendadulibre")
	for (let i = 0; i < elements.length; i++) {
		const element = elements[i]
		const controller = new Controller(element, url, model, view)
		controller.refresh()
	}
}

export class Model {
	constructor(url, parameters_arg, get=fetch) {
		this.parametersMap = new Map([
			["year", "period[year]"],
			["week", "period[week]"],
			["location", "near[location]"],
			["distance", "near[distance]"],
			["region", "region"],
		])

		// This allows for testability in node.js through basic dependency injection.
		this.get = get
		this.url = url

		const date = new IsoDate()
		this.parameters = this._sortParameters(parameters_arg)
		if (this.parameters.has("week"))
			this._parseParameter("week", date.getWeek.bind(date))
		this._parseParameter("year", date.getFullYear.bind(date))

		this.date = date
	}

	_sortParameters(arg, date) {
		const parameters = new Map()

		if (!("region" in arg || "week" in arg || "year" in arg)) {
			const date = new IsoDate()
			parameters.set("year", date.getFullYear())
		}

		for (const name of this.parametersMap.keys()) {
			if (name in arg)
				parameters.set(name, arg[name])
		}

		return parameters
	}

	_parseParameter(name, date_method) {
		const parameters = this.parameters
		const value = parameters.get(name)
		const tokens = /^current\s*(\+|-)?\s*(\d+)?$/.exec(value)
		if (tokens !== null) {
			const op_token = tokens[1]
			// Can't do the conversion to a number here because else
			// we get NaN which is of type "number".
			const num = tokens[2]
			let operation = (x, y) => x
			if ((typeof op_token !== "undefined") && (typeof num !== "undefined"))
				operation = op_token === "+" ? (x, y) => x + +y : (x, y) => x - +y
			parameters.set(name, operation(date_method(), num))
		}
		return parameters
	}

	async fetch() {
		const {parameters, get} = this
		let args = ""
		for (const [key, parameter] of parameters)
			 args += `&${this.parametersMap.get(key)}=${parameter}`
		args = args.substring(1)

		const res = await get(`${this.url}?${args}`)
		const events = res.json()

		for (const event of events) {
			event.url_json = event.url
			event.url = event.url_json.replace(/\.json$/, "")
			event.start_time = new IsoDate(event.start_time)
			event.end_time = new IsoDate(event.start_time)
		}
		this.events = events
		return this
	}

	sortByDate() {
		this.events = this.events.sort((x, y) => x.start_time - y.start_time)
		return this
	}
}

export class View {
	constructor(element) {
		this.element = element
		this.keys = [ "year", "week", "location", "distance", "region" ]
		this.dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
		this.localizeDate = new Intl.DateTimeFormat("fr-Fr", this.dateFormat)
	}

	get parameters() {
		const dataset = this.element.dataset
		const params = {}
		for (const key of this.keys) {
			if (key in dataset)
				params[key] = dataset[key]
		}
		return params
	}
	
	render(model) {
		const element = this.element
		const events = model.sortByDate().events
		const subElement = this._subElement
		const caps = this._capitalize

		if (events.length === 0)
			return this._empty()

		this._deleteChildren(element)

		const table = subElement(element, "table")
		const tbody = subElement(table, "tbody")

		if (events.length > 1)
			this._tableHeader(table, "Évènement", "Date", "Lieu")

		for (const event of events) {
			const row = subElement(tbody, "tr")

			const title_cell = subElement(row, "td")
			const title = subElement(title_cell, "a")
			const date = subElement(row, "td")
			const address = subElement(row, "td")

			title.textContent = event.title
			title.href = event.url
			date.textContent = caps(this.localizeDate.format(event.start_time))
			address.textContent = `${event.city} — ${event.address}, ${event.place_name}`
		}
		return this
	}

	_tableHeader(table, ...titles) {
		const subElement = this._subElement
		const thead = subElement(table, "thead")
		const row = subElement(thead, "tr")
		for (const title of titles) {
			const cell = subElement(row, "th")
			cell.textContent = title
		}
		return table
	}

	_capitalize(str) {
		return str[0].toUpperCase() + str.slice(1)
	}

	_subElement(parent, tag_name) {
		const tag = document.createElement(tag_name)
		parent.appendChild(tag)
		return tag
	}

	_empty() {
		const msg = this._subElement(this.element, "span")
		msg.classList.add("empty")
		msg.textContent = "Aucun évènement à afficher."
	}

	_deleteChildren(parent) {
		while (parent.hasChildNodes())
			parent.removeChild(parent.firstChild)
	}

	error(msg) {
		this._deleteChildren(this.element)
		const err_msg = this._subElement(this.element, "span")
		err_msg.classList.add("error")
		err_msg.textContent = msg
		const retry = this._subElement(this.element, "button")
		retry.textContent = "Réessayer"
		return {retry, err_msg}
	}
}

export class Controller {
	constructor(element, api_url, model=Model, view=View) {
		this.url = api_url
		this.element = element
		this.Model = model
		this.View = view
	}
	
	async refresh() {
		if (!("view" in this))
			this.init()
		const {element, view, Model, url} = this

		const model = new Model(url, view.parameters)
		try {
			await model.fetch()
			view.render(model)
		} catch(err) {
			const {retry} = view.error("Échec de connexion.")
			retry.onclick = () => this.refresh()
		}
		return this
	}

	init() {
		this.view = new this.View(this.element)
		return this
	}
}
