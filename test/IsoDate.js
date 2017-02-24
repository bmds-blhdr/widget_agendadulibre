import test from "tape"
import IsoDate from "../src/IsoDate"

// From https://en.wikipedia.org/wiki/ISO_week_date#Relation_with_the_Gregorian_calendar (2017-02-11).
const cases = [
	[[2005,   0,   1],  53],
	[[2005,   0,   2],  53],
	[[2005,  11,  31],  52],
	[[2007,   0,   1],   1],
	[[2007,  11,  30],  52],
	[[2007,  11,  31],   1],
	[[2008,   0,   1],   1],
	[[2008,  11,  28],  52],
	[[2008,  11,  29],   1],
	[[2008,  11,  30],   1],
	[[2008,  11,  31],   1],
	[[2009,   0,   1],   1],
	[[2009,  11,  31],  53],
	[[2010,   0,   1],  53],
	[[2010,   0,   2],  53],
	[[2010,   0,   3],  53],
]

test("IsoDate#getWeek", t => {
	t.plan(cases.length)
	for (const [args, week] of cases) {
		const date = new IsoDate(...args)
		t.equal(date.getWeek(), week)
	}
})
