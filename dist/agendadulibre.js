(function (exports) {
'use strict';

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a);}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d);}function d(e){c(e,1);}c();})}

class IsoDate extends Date {
	constructor(...args) {
		super(...args);
	}
	getIsoDay() {
		const day = super.getDay();
		return day === 0 ? 6 : day - 1
	}
	addDays(days) {
		this.setDate(this.getDate() + days);
		return this
	}
	sameDayAs(date) {
		return (this.getFullYear() === date.getFullYear())
			&& (this.getMonth() === date.getMonth())
			&& (this.getDate() === date.getDate())
	}
	setWeek(num) {
		const delta_days = (num - this.getWeek()) * 7;
		this.addDays(delta_days);
		return this
	}
	getWeek() {
		const date = this.getFirstWeek();
		let days = Math.trunc((this - this.getFirstWeek()) / (24 * 60 * 60 * 1000)) + 1;
		date.addDays(days);
		while (!this.sameDayAs(date)) {
			const offset = this - date > 0 ? 1 : -1;
			days += offset;
			date.addDays(offset);
		}
		return Math.trunc(days / 7) + 1
	}
	getFirstWeek() {
		const year = this.getFullYear();
		let first_week;
		for (let i = 1; i >= -1; i--) {
			first_week = this.firstWeekOfYear(year + i);
			if (this - first_week >= 0)
				return first_week
		}
	}
	firstWeekOfYear(year) {
		const date = new IsoDate(year, 0, 4);
		date.setDate(date.getDate() - date.getIsoDay());
		return date
	}
}

function fetch(url) {
	const req = new XMLHttpRequest();
	return new Promise((resolve, reject) => {
		req.addEventListener("load", () => {
			const res = new FetchResponse(req);
			resolve(res);
		});
		req.addEventListener("error", reject);
		req.open("GET", encodeURI(url));
		req.send();
	})
}
class FetchResponse {
	constructor(request) {
		this.request = request;
		this.status = request.status;
		this.statusText = request.statusText;
	}
	text() {
		return this.request.responseText
	}
	json() {
		return JSON.parse(this.text())
	}
}

const version = "1.1.0";
function run(url, view=View, model=Model, controller=Controller) {
	const elements = document.getElementsByClassName("agendadulibre");
	for (let i = 0; i < elements.length; i++) {
		const element = elements[i];
		const controller = new Controller(element, url, model, view);
		controller.refresh().catch(console.error.bind(console));
	}
}
class Model {
	constructor(url, parameters_arg, get=fetch) {
		this.parametersMap = new Map([
			["year", "period[year]"],
			["week", "period[week]"],
			["location", "near[location]"],
			["distance", "near[distance]"],
			["region", "region"],
		]);
		this.get = get;
		this.url = url;
		const date = new IsoDate();
		this.parameters = this._sortParameters(parameters_arg);
		if (this.parameters.has("week"))
			this._parseParameter("week", date.getWeek.bind(date));
		this._parseParameter("year", date.getFullYear.bind(date));
		this.date = date;
	}
	_sortParameters(arg, date) {
		const parameters = new Map();
		if (!("region" in arg || "week" in arg || "year" in arg)) {
			const date = new IsoDate();
			parameters.set("year", date.getFullYear());
		}
		for (const name of this.parametersMap.keys()) {
			if (name in arg)
				parameters.set(name, arg[name]);
		}
		return parameters
	}
	_parseParameter(name, date_method) {
		const parameters = this.parameters;
		const value = parameters.get(name);
		const tokens = /^current\s*(\+|-)?\s*(\d+)?$/.exec(value);
		if (tokens !== null) {
			const op_token = tokens[1];
			const num = tokens[2];
			let operation = (x, y) => x;
			if ((typeof op_token !== "undefined") && (typeof num !== "undefined"))
				operation = op_token === "+" ? (x, y) => x + +y : (x, y) => x - +y;
			parameters.set(name, operation(date_method(), num));
		}
		return parameters
	}
	fetch() {return __async(function*(){
		const {parameters, get} = this;
		let args = "";
		for (const [key, parameter] of parameters)
			 args += `&${this.parametersMap.get(key)}=${parameter}`;
		args = args.substring(1);
		const res = yield get(`${this.url}?${args}`);
		const events = res.json();
		for (const event of events) {
			event.url_json = event.url;
			event.url = event.url_json.replace(/\.json$/, "");
			event.start_time = new IsoDate(event.start_time);
			event.end_time = new IsoDate(event.start_time);
		}
		this.events = events;
		return this
	}.call(this))}
	sortByDate() {
		this.events = this.events.sort((x, y) => x.start_time - y.start_time);
		return this
	}
}
class View {
	constructor(element) {
		this.element = element;
		this.keys = [ "year", "week", "location", "distance", "region" ];
		this.dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		this.localizeDate = new Intl.DateTimeFormat("fr-Fr", this.dateFormat);
	}
	get parameters() {
		const dataset = this.element.dataset;
		const params = {};
		for (const key of this.keys) {
			if (key in dataset)
				params[key] = dataset[key];
		}
		return params
	}
	render(model) {
		const element = this.element;
		const events = model.sortByDate().events;
		const subElement = this._subElement;
		const caps = this._capitalize;
		if (events.length === 0)
			return this._empty()
		this._deleteChildren(element);
		const table = subElement(element, "table");
		const tbody = subElement(table, "tbody");
		if (events.length > 1)
			this._tableHeader(table, "Évènement", "Date", "Lieu");
		for (const event of events) {
			const row = subElement(tbody, "tr");
			const title_cell = subElement(row, "td");
			const title = subElement(title_cell, "a");
			const date = subElement(row, "td");
			const address = subElement(row, "td");
			title.textContent = event.title;
			title.href = event.url;
			date.textContent = caps(this.localizeDate.format(event.start_time));
			address.textContent = `${event.city} — ${event.address}, ${event.place_name}`;
		}
		return this
	}
	_tableHeader(table, ...titles) {
		const subElement = this._subElement;
		const thead = subElement(table, "thead");
		const row = subElement(thead, "tr");
		for (const title of titles) {
			const cell = subElement(row, "th");
			cell.textContent = title;
		}
		return table
	}
	_capitalize(str) {
		return str[0].toUpperCase() + str.slice(1)
	}
	_subElement(parent, tag_name) {
		const tag = document.createElement(tag_name);
		parent.appendChild(tag);
		return tag
	}
	_empty() {
		const msg = this._subElement(this.element, "span");
		msg.classList.add("empty");
		msg.textContent = "Aucun évènement à afficher.";
	}
	_deleteChildren(parent) {
		while (parent.hasChildNodes())
			parent.removeChild(parent.firstChild);
	}
	error(msg) {
		this._deleteChildren(this.element);
		const err_msg = this._subElement(this.element, "span");
		err_msg.classList.add("error");
		err_msg.textContent = msg;
		const retry = this._subElement(this.element, "button");
		retry.textContent = "Réessayer";
		return {retry, err_msg}
	}
}
class Controller {
	constructor(element, api_url, model=Model, view=View) {
		this.url = api_url;
		this.element = element;
		this.Model = model;
		this.View = view;
	}
	refresh() {return __async(function*(){
		if (!("view" in this))
			this.init();
		const {element, view, Model, url} = this;
		const model = new Model(url, view.parameters);
		try {
			yield model.fetch();
			view.render(model);
		} catch(err) {
			const {retry} = view.error("Échec de connexion.");
			retry.onclick = () => this.refresh();
		}
		return this
	}.call(this))}
	init() {
		this.view = new this.View(this.element);
		return this
	}
}

exports.version = version;
exports.run = run;
exports.Model = Model;
exports.View = View;
exports.Controller = Controller;

}((this.agendadulibre = this.agendadulibre || {})));
