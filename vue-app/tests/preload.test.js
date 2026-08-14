import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const preloadSource = readFileSync(new URL('../../preload.js', import.meta.url), 'utf8')

function createAIUtil(chunks) {
  let chunkIndex = 0
  const window = {
    utools: {
      dbStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined
      },
      db: { allDocs: () => [] },
      removeFeature: () => undefined,
      setFeature: () => undefined,
      onPluginEnter: () => undefined,
      showNotification: () => undefined
    }
  }

  vm.runInNewContext(preloadSource, {
    window,
    console: { log: () => undefined, error: () => undefined },
    require: (name) => name === 'electron' ? { clipboard: {} } : undefined,
    fetch: async () => ({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => chunkIndex < chunks.length
            ? { done: false, value: chunks[chunkIndex++] }
            : { done: true }
        })
      }
    }),
    AbortController,
    TextDecoder,
    setTimeout
  })

  return window.preload.aiUtil
}

function splitBytes(text, indexes) {
  const bytes = new TextEncoder().encode(text)
  const chunks = []
  let start = 0
  for (const end of indexes) {
    chunks.push(bytes.slice(start, end))
    start = end
  }
  chunks.push(bytes.slice(start))
  return chunks
}

test('callAI keeps complete content when SSE JSON spans network chunks', async () => {
  const stream = [
    'data: {"choices":[{"delta":{"content":"Hello"}}]}\r\n\r\n',
    'data: {"choices":[{"delta":{"content":" world"}}]}\r\n\r\n',
    'data: [DONE]\r\n\r\n'
  ].join('')
  const aiUtil = createAIUtil(splitBytes(stream, [62, 71]))

  const result = await aiUtil.callAI(
    { model: 'test', url: 'https://example.test', key: 'secret' },
    [],
    () => undefined
  )

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    content: 'Hello world',
    reasoningContent: ''
  })
})

test('callAI parses Bailian-compatible reasoning frames without a space after data:', async () => {
  const stream = [
    'data:{"choices":[{"delta":{"reasoning_content":"先思考"}}]}\n\n',
    'data:{"choices":[{"delta":{"content":"最终答案"}}]}\n\n',
    'data:[DONE]\n\n'
  ].join('')
  const encoded = new TextEncoder().encode(stream)
  const chineseByte = encoded.findIndex(byte => byte > 127)
  const aiUtil = createAIUtil([
    encoded.slice(0, chineseByte + 1),
    encoded.slice(chineseByte + 1, chineseByte + 17),
    encoded.slice(chineseByte + 17)
  ])
  const progressEvents = []

  const result = await aiUtil.callAI(
    { model: 'deepseek-r1', url: 'https://example.test', key: 'secret' },
    [],
    progress => progressEvents.push(JSON.parse(JSON.stringify(progress)))
  )

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    content: '最终答案',
    reasoningContent: '先思考'
  })
  assert.deepEqual(progressEvents.at(-1), {
    content: '最终答案',
    reasoningContent: '先思考',
    isThinking: false
  })
})
