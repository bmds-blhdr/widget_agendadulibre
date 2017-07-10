Un widget en javascript for récupérer et afficher les évènements à venir de l'[agendadulibre.org](https://agendadulibre.org).

# Compatibilité

Ce widget n'est compatible qu'avec les navigateurs supportant les fonctionnalités d'ES2015, sauf import/export. Firefox, Chrome, Opera après la version 12 ne devraient poser aucun soucis. Internet Explorer n'est pas suppporté. Safari et Edge doivent être à jour (écrit en février 2017). De même, si vous souhaitez utiliser le serveur de développement ou re-créer le script, node.js doit supporter ES2015 (la 6.10 ou plus récent fonctionnera).

# Usage

`dist/agendadulibre.js` contient un script prêt à l'emploi qui injecte un objet `agendadulibre` dans le contexte global. Pour l'utiliser, vous passez à sa fonction `run` l'addresse de l'API d'agendadulibre (https://agendadulibre.org/events.json) quand le document est prêt. Exemple :

```javascript
document.addEventListener("DOMContentLoaded", () => agendadulibre.run("https://agendadulibre.org/events.json"))
```

Cette fonction `run` va utiliser toute balise qui a la classe « agendadulibre » pour y afficher les données. Les attributs "data" sont utilisés pour récuperer d'éventuels paramètres à passer à l'API d'agendadulibre.org. Voici un exemple qui récupère les évènements à 20km de Tours pour l'année courante :

```html
<div class="agendadulibre" data-location="Tours" data-distance="20"></div>
```

Les paramètres supportés sont :

| Attribute     | Type                 | Description                          |
|:------------- |:--------------------:| ------------------------------------:|
| data-year     | nombre               | Année des évènements                 |
| data-week     | nombre               | Numéro de semaine ISO des évènements |
| data-location | chaîne de caractères | Lieu des évènements                  |
| data-distance | nombre               | Distance autour des lieux            |
| data-region   | nombre               | ID de la région spécifique à l'API   |

Pour l'id de la région, vous devez aller sur agendadulibre.org, sélectioner la région souhaitée et trouver à quoi elle correspond dans l'addresse qui récupère les évènements. `data-week` et `data-year` acceptent d'autre part une adition ou une soustraction relative à l'année courante ou à la semaine courante, ou simplement le mot-clé « current »:

```html
data-week="current + 3"
data-year="current - 1"
data-week="current"
```

`data-year="current"` revient à ne pas mettre l'attribut `data-year`.

Veuillez noter que bien que ce script accepte les années ou semaines passées ou futures, l'API d'agendadulibre.org peut ne pas les supporter, ou dans certaines limites, et ne pas retourner pour autant de message d'erreur.

Voyez `index.html` pour un exemple complet qui récupère des données de test du serveur de développement.

# Développement

## Génération du projet

Changez de dossier courant pour aller dans celui de ce projet et utilisez `npm install` pour installer les dépendances.

Le système de build utilise des scripts npm :

| Commande        | Description                             |
|:--------------- | ---------------------------------------:|
| `npm test`      | crée et lance les tests                 |
| `npm run build` | génération pour les navigateurs         |
| `npm start`     | génère et lance le serveur de dév       |
| `npm run clean` | efface les fichiers générés             |

Par défaut le serveur de développement écoute sur localhost, port 8000 ; vous pouvez passer d'autres paramètres avec `npm start -- <port> [<hôte>]`. Il sert `index.html`, `dist/agendadulibre.js` et `index.css`; vous pouvez modifier ces fichiers pour développer vos propres modifications ou un style CSS.

## Modifier l'affichage des données

Vous pouvez créer votre propre fonction d'init avec les modules fournis. La fonction par défaut, `run` accepte, dans cet ordre, View, Model et Controller. La manière la plus simple de créer des dépendances différentes est d'étendre celles déjà présentes et de les passer à Controller ou `run`. Par exemple, on modifiera la méthode `render` de View (qui prend un Model comme argument) pour produire du HTML différent.

Pour modifier le rendu des données, créez une classe qui étend `agendadulibre.View` et passez-la à `agendadulibre.run` ou directement à Controller si vous faites un remplacement pour `run`. Voici un exemple qui filtre les évènements par ville et rafraîchit toutes les minutes (utilise le serveur de développement sur son port par défaut):

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
    setInterval(run, 60000)
    run()
  })
</script>
```
