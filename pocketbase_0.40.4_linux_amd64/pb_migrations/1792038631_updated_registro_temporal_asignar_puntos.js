/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2093408650")

  // remove field
  collection.fields.removeById("relation4150323840")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_308246142",
    "help": "",
    "hidden": false,
    "id": "relation233263274",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "codigo_barras",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2093408650")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_308246142",
    "help": "",
    "hidden": false,
    "id": "relation4150323840",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "id_producto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("relation233263274")

  return app.save(collection)
})
