// Class to compute the ISO 8601 week numbers correctly.
// Breaks for dates before 1970-01-01.
export default class IsoDate extends Date {

	constructor(...args) {
		super(...args)
	}

	getIsoDay() {
		const day = super.getDay()
		return day === 0 ? 6 : day - 1
	}

	addDays(days) {
		this.setDate(this.getDate() + days)
		return this
	}

	sameDayAs(date) {
		return (this.getFullYear() === date.getFullYear())
			&& (this.getMonth() === date.getMonth())
			&& (this.getDate() === date.getDate())
	}

	setWeek(num) {
		const delta_days = (num - this.getWeek()) * 7
		this.addDays(delta_days)
		return this
	}

	getWeek() {
		const date = this.getFirstWeek()
		// First approximation, as a day doesn't always have 24 hours in it due to DST.
		let days = Math.trunc((this - this.getFirstWeek()) / (24 * 60 * 60 * 1000)) + 1
		date.addDays(days)
		// We shouldn't end up really far from the current date, ±1 should be good enough.
		while (!this.sameDayAs(date)) {
			const offset = this - date > 0 ? 1 : -1
			days += offset
			date.addDays(offset)
		}
		// If we used Math.ceil instead this would produce 0 if we were in the first day of the first week.
		return Math.trunc(days / 7) + 1
	}

	getFirstWeek() {
		const year = this.getFullYear()
		let first_week
		// The first week may start during the current, previous or next year.
		for (let i = 1; i >= -1; i--) {
			first_week = this.firstWeekOfYear(year + i)
			// The first week's first day must precede or be equal to the current date.
			if (this - first_week >= 0)
				return first_week
		}
	}

	firstWeekOfYear(year) {
		// In ISO 8601, the first week is the week with the first thursday of the year.
		// According to https://en.wikipedia.org/wiki/ISO_week_date#First_Week (2017-02-11)
		// this is the same week that has the fourth of january in it.
		const date = new IsoDate(year, 0, 4)
		date.setDate(date.getDate() - date.getIsoDay())
		return date
	}
}
