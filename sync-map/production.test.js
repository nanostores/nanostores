process.env.NODE_ENV = 'production'

let { TestClient } = require('@logux/client')
let { delay } = require('nanodelay')

let { SyncMap, subscribe, loading } = require('../index.js')

class Post extends SyncMap {}
Post.plural = 'posts'

it('changes keys in production mode', async () => {
  let client = new TestClient('10')
  client.on('add', (action, meta) => {
    if (action.type === 'logux/subscribe') {
      client.log.add({ type: 'logux/processed', id: meta.id })
    }
  })
  await client.connect()
  let post = new Post('ID', client)

  let changes = []
  post[subscribe](() => {
    changes.push(post.title)
  })

  await post[loading]

  await post.change('title', '1')
  await post.change('title', '1')
  expect(post.title).toEqual('1')

  client.server.log.add({
    type: 'posts/changed',
    id: 'ID',
    diff: { title: '2' }
  })
  await delay(10)
  expect(post.title).toEqual('2')

  expect(changes).toEqual(['1', '2'])
})
