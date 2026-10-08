import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useModelStore } from '../src/stores/modelStore.js'

const models = [
  { name: 'A', model: 'a', url: 'https://a.test', key: 'key-a' },
  { name: 'B', model: 'b', url: 'https://b.test', key: 'key-b' },
  { name: 'C', model: 'c', url: 'https://c.test', key: 'key-c' }
]

function setupStore(savedIndex, savedModels = models) {
  const savedIndexes = []
  global.window = {
    preload: {
      dbUtil: {
        getModelConfig: () => structuredClone(savedModels),
        getModelIndex: () => savedIndex,
        getThinkingBudget: () => 32768,
        saveModelConfig: () => undefined,
        saveModelIndex: index => savedIndexes.push(index)
      }
    }
  }
  setActivePinia(createPinia())
  const store = useModelStore()
  store.loadModelConfigs()
  return { store, savedIndexes }
}

test('deleting a model before the current model keeps the same model selected', () => {
  const { store, savedIndexes } = setupStore(1)

  store.deleteModel(0)

  assert.equal(store.currentModel.name, 'B')
  assert.equal(store.currentModelIndex, 0)
  assert.equal(savedIndexes.at(-1), 0)
})

test('deleting the current model selects a valid neighbor and persists its index', () => {
  const { store, savedIndexes } = setupStore(2)

  store.deleteModel(2)

  assert.equal(store.currentModel.name, 'B')
  assert.equal(store.currentModelIndex, 1)
  assert.equal(savedIndexes.at(-1), 1)
})

test('loading an out-of-range model index clamps and repairs persisted state', () => {
  const { store, savedIndexes } = setupStore(99)

  assert.equal(store.currentModel.name, 'C')
  assert.equal(store.currentModelIndex, 2)
  assert.equal(savedIndexes.at(-1), 2)
})
