import '@testing-library/jest-dom/extend-expect'
import React, { FC } from 'react'
import ReactTesting from '@testing-library/react'
import { delay } from 'nanodelay'

import { createStore, createMap, defineMap } from '../index.js'
import { useStore } from './index.js'

let { render, screen, act } = ReactTesting
let { createElement: h, useState } = React

function getCatcher(cb: () => void): [string[], FC] {
  let errors: string[] = []
  let Catcher: FC = () => {
    try {
      cb()
    } catch (e) {
      errors.push(e.message)
    }
    return null
  }
  return [errors, Catcher]
}

it('throws on builder instead of store', () => {
  let Test = (): void => {}
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useStore(Test, 'ID')
  })
  render(h(Catcher))
  expect(errors).toEqual([
    'Use useStore(Builder(id)) or useSync() ' +
      'from @logux/client/react for builders'
  ])
})

it('renders simple store', async () => {
  let events: string[] = []
  let renders = 0

  let letter = createStore<string>(() => {
    events.push('constructor')
    letter.set('a')
    return () => {
      events.push('destroy')
    }
  })

  let second = createStore<number>(() => {
    second.set(0)
  })

  let Test1: FC = () => {
    renders += 1
    let value = useStore(letter)
    let number = useStore(second)
    return h('div', { 'data-testid': 'test1' }, `${value}${number}`)
  }

  let Test2: FC = () => {
    let value = useStore(letter)
    return h('div', { 'data-testid': 'test2' }, value)
  }

  let Wrapper: FC = () => {
    let [show, setShow] = useState<boolean>(true)
    return h(
      'div',
      {},
      h('button', {
        onClick: () => {
          setShow(false)
        }
      }),
      show && h(Test1),
      show && h(Test2)
    )
  }

  render(h(Wrapper))
  expect(events).toEqual(['constructor'])
  expect(screen.getByTestId('test1')).toHaveTextContent('a0')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  await act(async () => {
    letter.set('b')
    letter.set('c')
    second.set(1)
    await delay(1)
  })

  expect(screen.getByTestId('test1')).toHaveTextContent('c1')
  expect(screen.getByTestId('test2')).toHaveTextContent('c')
  expect(renders).toEqual(2)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  await delay(1020)

  expect(events).toEqual(['constructor', 'destroy'])
})

it('does not reload store on component changes', async () => {
  let destroyed = ''
  let simple = createStore<string>(() => {
    simple.set('S')
    return () => {
      destroyed += 'S'
    }
  })
  let Map = defineMap<{ id: string }>((store, id) => {
    return () => {
      destroyed += id
    }
  })

  let TestA: FC = () => {
    let simpleValue = useStore(simple)
    let map = useStore(Map('M'))
    return h('div', { 'data-testid': 'test' }, `1 ${simpleValue} ${map.id}`)
  }

  let TestB: FC = () => {
    let simpleValue = useStore(simple)
    let map = useStore(Map('M'))
    return h('div', { 'data-testid': 'test' }, `2 ${simpleValue} ${map.id}`)
  }

  let Switcher: FC = () => {
    let [state, setState] = useState<'a' | 'b' | 'none'>('a')
    if (state === 'a') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('b')
          }
        }),
        h(TestA)
      )
    } else if (state === 'b') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('none')
          }
        }),
        h(TestB)
      )
    } else {
      return null
    }
  }

  render(h(Switcher))
  expect(screen.getByTestId('test')).toHaveTextContent('1 S M')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.getByTestId('test')).toHaveTextContent('2 S M')
  expect(destroyed).toEqual('')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(destroyed).toEqual('')

  await delay(1020)
  expect(destroyed).toEqual('SM')
})

it('has observeOnly option', async () => {
  type MapStore = {
    a?: string
    b?: string
  }
  let Wrapper: FC = ({ children }) => h('div', {}, children)
  let mapSore = createMap<MapStore>()
  let renderCount = 0
  let MapTest = (): React.ReactElement => {
    renderCount++
    let [observeOnly, setObserveOnly] = useState(['a'])
    let { a, b } = useStore(mapSore, { observeOnly })
    return h(
      'div',
      { 'data-testid': 'map-test' },
      h('button', {
        onClick: () => {
          setObserveOnly(['a', 'b'])
        }
      }),
      `map:${a}-${b}`
    )
  }

  render(h(Wrapper, {}, h(MapTest)))

  expect(screen.getByTestId('map-test')).toHaveTextContent(
    'map:undefined-undefined'
  )
  expect(renderCount).toBe(1)

  // updates on init
  await act(async () => {
    mapSore.notify(undefined as unknown as keyof MapStore)
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent(
    'map:undefined-undefined'
  )
  expect(renderCount).toBe(2)

  // updates when has key
  await act(async () => {
    mapSore.setKey('a', 'a')
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-undefined')
  expect(renderCount).toBe(3)

  // does not update when has no key
  await act(async () => {
    mapSore.setKey('b', 'b')
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-undefined')
  expect(renderCount).toBe(3)

  // reacts on parameter changes
  await act(async () => {
    screen.getByRole('button').click()
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-b')
  expect(renderCount).toBe(5)
})
