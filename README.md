[Traduction française](README.fr.md)

A javascript widget for fetching and displaying [agendadulibre.org](https://agendadulibre.org)'s upcoming events.

# Compatibility

The targeted browsers need to support ES2015 features, except import/export statements (Firefox, Chrome and Opera after v12 should be fine, IE won't, and Safari and Edge need to be very recent as of february 2017). Same for node.js if you want to use the development server or build the script (6.10 and higher will be fine).

# Usage

`dist/agendadulibre.js` contains a pre-built, self-contained script which injects an `agendadulibre` object in the global scope. You can then pass to its `run` function the url of the endpoint (https://agendadulibre.org/events.json) when the document is ready, like so:

```javascript
document.addEventListener("DOMContentLoaded", () => agendadulibre.run("https://agendadulibre.org/events.json"))
```

This function will turn any tag that has the class "agendadulibre" into a container to display the fetched events. It uses 'data' attributes as arguments passed to the API of agendadulibre.org; here's an example that fetches any event 20km around Tours for the current year:

```html
<div class="agendadulibre" data-location="Tours" data-distance="20"></div>
```

Supported arguments are:

| Attribute     | Type   | Description                   |
|:------------- |:------:| -----------------------------:|
| data-year     | number | Year of the events            |
| data-week     | number | ISO Week number of the events |
| data-location | string | Location of the events        |
| data-distance | number | Distance to the location      |
| data-region   | number | API-specific region id        |

To get the region's id you need to go on agendadulibre.org, select the desired region and look at the query url. `data-week` and `data-year` also accept an addition or a substraction relative to the current year or week, or simply the 'current' keyword:

```html
data-week="current + 3"
data-year="current - 1"
data-week="current"
```

`data-year="current"` is equivalent to omitting the 'data-year' attribute altogether.

Please note that while this script supports fetching data for the precedent or next year and past/future weeks, agendadulibre.org's API might not, and could return unwanted data instead of returning an error.

See `index.html` for a complete example that fetches fake data from the development server.

# Development

## Building

Change your current directory to the project's folder and type `npm install` to install its dependencies.

The build system uses npm scripts:

| Command         | Description                             |
|:--------------- | ---------------------------------------:|
| `npm test`      | builds and runs the tests               |
| `npm run build` | builds for the browser                  |
| `npm start`     | builds and start the development server |
| `npm run clean` | cleans all generated files              |

By default the development server listen on localhost on the port 8000; you can pass other arguments by typing `npm start -- <port number> [<host>]`.

It serves `index.html`, `dist/agendadulibre.js` and `index.css`; you can modify those files to develop your own customizations of this module or test styles.

## Modify how the data is displayed without altering the source code

You can build your own init function with the provided modules. The default `run` function accepts (in that order) view, model and controller dependencies. The easiest way to create custom dependencies is to extend those already present. Typically, you might want to override View's `render` function (which takes a Model as its argument) so as to produce custom HTML.

To change how the fetched data is rendered as html, create a new class that extends `agendadulibre.View` and pass that to `agendadulibre.run` or directly to the controller if you want to write your own replacement for `run`. Here is an example of a modification that filters the events by city and refreshes every minute (from the development server's default port):

```html
<script src="http://localhost:8000/agendadulibre.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const cities = ["Orléans", "Tours", "La Riche", "Blois"]
    class View extends agendadulibre.View {
      render(model) {
        model.events = model.events.filter(event => cities.indexOf(event.city) > -1)
        return super.render(model)
      }
    }
    const run = () => agendadulibre.run("http://localhost:8000/_api/agendadulibre", View)
    setTimeout(run, 60000)
    run()
  })
</script>
```
