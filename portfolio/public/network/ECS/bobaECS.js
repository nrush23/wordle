/** @class World very very basic ecs implementation based on miniplex ecs to store entities and their components as central repository of data for easy world snap shotting and rendering */
function createWorld() {
  let nextEntityId = 1;

  const entities = new Set();                  // Set<number>
  //map of all components types in world, value is entity mapping to corresponding component data
  const components = new Map();                // Map<string, Map<number, any>>

  function createEntity() {
    const id = nextEntityId++;
    entities.add(id);
    return id;
  }

  function destroyEntity(id) {
    entities.delete(id);
    for (const store of components.values()) {
      store.delete(id);
    }
  }

  function getStore(name) {
    if (!components.has(name)) {
      components.set(name, new Map());
    }
    return components.get(name);
  }

  function addComponent(id, name, data) {
    const store = getStore(name);
    store.set(id, data);
  }

  function removeComponent(id, name) {
    const store = components.get(name);
    if (store) store.delete(id);
  }

  function getComponent(id, name) {
    const store = components.get(name);
    return store ? store.get(id) : undefined;
  }

  // Query entities that have ALL listed components
  function query(...names) {
    const result = [];

    for (const id of entities) {
      let ok = true;
      for (const name of names) {
        const store = components.get(name);
        if (!store || !store.has(id)) {
          ok = false;
          break;
        }
      }
      if (ok) result.push(id);
    }

    return result;
  }

  return {
    createEntity,
    destroyEntity,
    addComponent,
    removeComponent,
    getComponent,
    query
  };
}

export { createWorld };