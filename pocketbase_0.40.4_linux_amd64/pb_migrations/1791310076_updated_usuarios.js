/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_252440813")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_igz8on4n4q` ON `usuarios` (`dni`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_252440813")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
