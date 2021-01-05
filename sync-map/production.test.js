process.env.NODE_ENV = 'production'

let { TestClient } = require('@logux/client')
let { delay } = require('nanodelay')

let { SyncMap, emitter } = require('../index.js')

class Post extends SyncMap {}
Post.plural = 'posts'

it('changes keys in production mode', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post('ID', client)

  let changes = []
  post[emitter].on('change', () => {
    changes.push(post.title)
  })

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
