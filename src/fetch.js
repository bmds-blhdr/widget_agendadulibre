// Shim for the fetch API.
export default function fetch(url) {
	const req = new XMLHttpRequest()
	return new Promise((resolve, reject) => {
		req.addEventListener("load", () => {
			const res = new FetchResponse(req)
			resolve(res)
		})
		req.addEventListener("error", reject)
		req.open("GET", encodeURI(url))
		req.send()
	})
}

class FetchResponse {
	constructor(request) {
		this.request = request
		this.status = request.status
		this.statusText = request.statusText
	}

	text() {
		return this.request.responseText
	}

	json() {
		return JSON.parse(this.text())
	}
}
