/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_308246142")

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "aprobado",
      "pendiente"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_308246142")

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 2,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "aprobado",
      "pendiente"
    ]
  }))

  return app.save(collection)
})
