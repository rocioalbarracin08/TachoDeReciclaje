/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_252440813")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "autodate2552575352",
    "name": "update",
    "onCreate": false,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_252440813")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "autodate2552575352",
    "name": "update",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
})
