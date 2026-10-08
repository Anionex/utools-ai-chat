import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../src/stores/chatStore.js'

function setupStore(callAI) {
  const saves = []
  global.window = {
    preload: {
      dbUtil: {
        saveChatHistory: (sessionId, messages, lastTime) => {
          saves.push({ sessionId, messages: structuredClone(messages), lastTime })
        },
        deleteChatHistory: () => undefined,
        getAllSessions: () => [],
        getChatHistory: () => []
      },
      aiUtil: {
        callAI,
        abortCurrentResponse: () => undefined
      }
    }
  }
  setActivePinia(createPinia())
  return { store: useChatStore(), saves }
}

const model = {
  name: 'Test',
  model: 'test-model',
  url: 'https://example.test',
  key: 'secret'
}

test('sendMessage persists streamed assistant content before the response finishes', async () => {
  let finishResponse
  const { store, saves } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'partial answer', reasoningContent: '', isThinking: false })
    await new Promise(resolve => { finishResponse = resolve })
  })
  store.createNewChat()

  const sendPromise = store.sendMessage('question', model)
  await Promise.resolve()

  assert.equal(saves.at(-1).messages.at(-1).content, 'partial answer')

  finishResponse()
  await sendPromise
})

test('sendMessage preserves a partial answer when the stream later fails', async () => {
  const { store, saves } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'useful partial answer', reasoningContent: '', isThinking: false })
    throw new Error('connection lost')
  })
  store.createNewChat()

  await assert.rejects(store.sendMessage('question', model), /connection lost/)

  assert.equal(saves.at(-1).messages.at(-1).content, 'useful partial answer')
})

test('flushPendingChatSave persists the latest throttled chunk before hiding', async () => {
  let finishResponse
  const { store, saves } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'first chunk', reasoningContent: '', isThinking: false })
    onProgress({ content: 'second chunk', reasoningContent: '', isThinking: false })
    await new Promise(resolve => { finishResponse = resolve })
  })
  store.createNewChat()

  const sendPromise = store.sendMessage('question', model)
  await Promise.resolve()
  store.flushPendingChatSave()

  assert.equal(saves.at(-1).messages.at(-1).content, 'second chunk')

  finishResponse()
  await sendPromise
})

test('a completed stream does not recreate a chat deleted during generation', async () => {
  let finishResponse
  const { store, saves } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'partial answer', reasoningContent: '', isThinking: false })
    await new Promise(resolve => { finishResponse = resolve })
  })
  const sessionId = store.createNewChat()

  const sendPromise = store.sendMessage('question', model)
  await Promise.resolve()
  store.deleteChatSession(sessionId)
  const saveCountAfterDeletion = saves.length

  finishResponse()
  await sendPromise

  assert.equal(saves.length, saveCountAfterDeletion)
  assert.equal(store.sessions.some(session => session.id === sessionId), false)
})

test('an older response finishing does not drop a newer unsaved chat', async () => {
  let finishResponse
  const { store } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'older answer', reasoningContent: '', isThinking: false })
    await new Promise(resolve => { finishResponse = resolve })
  })
  const olderSessionId = store.createNewChat()
  const sendPromise = store.sendMessage('older question', model)
  await Promise.resolve()

  await new Promise(resolve => setTimeout(resolve, 1))
  const newerSessionId = store.createNewChat()
  finishResponse()
  await sendPromise

  assert.equal(store.currentSessionId, newerSessionId)
  assert.equal(store.sessions.some(session => session.id === newerSessionId), true)
  assert.equal(store.sessions.some(session => session.id === olderSessionId), true)
})

test('ordinary edits discard an older throttled stream snapshot', async () => {
  let finishResponse
  const { store, saves } = setupStore(async (_model, _messages, onProgress) => {
    onProgress({ content: 'first chunk', reasoningContent: '', isThinking: false })
    onProgress({ content: 'stale second chunk', reasoningContent: '', isThinking: false })
    await new Promise(resolve => { finishResponse = resolve })
  })
  store.createNewChat()

  const sendPromise = store.sendMessage('question', model)
  await Promise.resolve()
  store.editMessage(1, 'edited answer')
  store.flushPendingChatSave()

  assert.equal(saves.at(-1).messages.at(-1).content, 'edited answer')

  finishResponse()
  await sendPromise
})
