/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2093408650")

  // update collection data
  unmarshal({
    "name": "registro_temporal_asignar_puntos"
  }, collection)

  // remove field
  collection.fields.removeById("number318702702")

  // remove field
  collection.fields.removeById("bool4180235056")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2093408650")

  // update collection data
  unmarshal({
    "name": "reciclajes"
  }, collection)

  // add field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "number318702702",
    "max": null,
    "min": null,
    "name": "puntos_otorgados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "bool4180235056",
    "name": "acreditado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
