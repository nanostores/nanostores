let {
  createContext,
  createElement,
  useContext,
  Component,
  useEffect,
  useState
} = require('react')

let { STORE_RESERVED_KEYS } = require('../store')
let { FilterStore } = require('../filter-store')

let ClientContext = /*#__PURE__*/ createContext()
let ErrorsContext = /*#__PURE__*/ createContext()

function useClient () {
  return useContext(ClientContext)
}

function useLocalStore (StoreClass) {
  let client = useClient()
  let [, forceRender] = useState({})

  let instance = StoreClass.load(client)
  if (process.env.NODE_ENV !== 'production') {
    if (instance.storeLoading) {
      throw new Error(
        `${StoreClass.name} is a remote store and need to be load ` +
          'with useRemoteStore()'
      )
    }
  }

  useEffect(() => {
    return instance.addListener(() => {
      forceRender({})
    })
  }, [StoreClass])
  return instance
}

function useRemoteStore (StoreClass, id) {
  let client = useContext(ClientContext)
  let [, forceRender] = useState({})
  let [error, setError] = useState(null)

  let instance
  if (process.env.NODE_ENV !== 'production') {
    try {
      instance = StoreClass.load(id, client)
    } catch (e) {
      if (e.message === 'Missed Logux client') {
        throw new Error('Wrap components in Logux <ClientContext.Provider>')
      } else {
        throw e
      }
    }
    if (!instance.storeLoading) {
      throw new Error(
        `${StoreClass.name} is a local store and need to be created ` +
          'with useLocalStore()'
      )
    }
  } else {
    instance = StoreClass.load(id, client)
  }

  if (process.env.NODE_ENV !== 'production') {
    let errorProcessors = useContext(ErrorsContext) || {}
    if (!errorProcessors.Error) {
      if (!errorProcessors.NotFound || !errorProcessors.AccessDenied) {
        throw new Error(
          'Wrap components in Logux ' +
            '<ChannelErrors NotFound={Page 404} AccessDenied={Page403}>'
        )
      }
    }
  }

  useEffect(() => {
    let unbind = instance.addListener(() => {
      forceRender({})
    })
    if (instance.isLoading) {
      instance.storeLoading.catch(e => {
        setError(e)
      })
    }
    return unbind
  }, [StoreClass, id])

  if (process.env.NODE_ENV !== 'production') {
    let loadingChecked = false
    instance = new Proxy(instance, {
      get (target, prop) {
        if (prop === 'isLoading') {
          loadingChecked = true
        }
        if (
          !loadingChecked &&
          !STORE_RESERVED_KEYS.has(prop) &&
          typeof target[prop] !== 'function' &&
          prop !== 'id'
        ) {
          throw new Error(
            'You need to check `store.isLoading` before calling any properties'
          )
        } else {
          return target[prop]
        }
      }
    })
  }

  if (error) throw error
  return instance
}

let ErrorsCheckerProvider = ({ children, ...props }) => {
  let prevErrors = useContext(ErrorsContext) || {}
  let errors = { ...props, ...prevErrors }
  return createElement(ErrorsContext.Provider, { value: errors }, children)
}

class ChannelErrors extends Component {
  constructor (props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError (error) {
    return { error }
  }

  render () {
    let error = this.state.error
    if (!error) {
      if (process.env.NODE_ENV === 'production') {
        return this.props.children
      } else {
        return createElement(ErrorsCheckerProvider, this.props)
      }
    } else if (error.name !== 'LoguxUndoError') {
      throw error
    } else if (error.action.reason === 'notFound') {
      if (this.props.NotFound) {
        return createElement(this.props.NotFound, { error })
      } else if (this.props.Error) {
        return createElement(this.props.Error, { error })
      } else {
        throw error
      }
    } else if (error.action.reason === 'denied') {
      if (this.props.AccessDenied) {
        return createElement(this.props.AccessDenied, { error })
      } else if (this.props.Error) {
        return createElement(this.props.Error, { error })
      } else {
        throw error
      }
    } else if (this.props.Error) {
      return createElement(this.props.Error, { error })
    } else {
      throw error
    }
  }
}

function useFilter (StoreClass, filter = {}, opts = {}) {
  let client = useClient()
  let instance = FilterStore.filter(client, StoreClass, filter, {
    listChangesOnly: true,
    ...opts
  })
  let [, forceRender] = useState({})
  let [error, setError] = useState(null)

  useEffect(() => {
    let unbind = instance.addListener(() => {
      forceRender({})
    })
    if (instance.isLoading) {
      instance.storeLoading.catch(e => {
        setError(e)
      })
    }
    return unbind
  }, [instance.id])

  if (process.env.NODE_ENV !== 'production') {
    if (opts.listChangesOnly !== false) {
      let enabled = false
      instance = new Proxy(instance, {
        get (target, prop) {
          if (prop === 'sorted') {
            if (!target.sorted) return undefined
            return new Proxy(target.sorted, {
              get (sorted, sortedProp) {
                if (sortedProp === 'map' && !enabled) {
                  throw new Error(
                    'Use map() function from "@logux/state/react" ' +
                      'to map filter results'
                  )
                } else {
                  enabled = false
                  return sorted[sortedProp]
                }
              }
            })
          } else {
            return target[prop]
          }
        },
        set (target, prop, value) {
          if (prop === 'enableMap') {
            enabled = true
          } else {
            target[prop] = value
          }
          return true
        }
      })
    }
  }

  if (error) throw error
  return instance
}

function map (filterStore, render) {
  let ItemSubscription = ({ store, index }) => {
    let [, forceRender] = useState({})
    useEffect(() => {
      return store.addListener(() => {
        forceRender({})
      })
    }, [store])
    return render(store, index)
  }

  let list
  if (typeof filterStore.length !== 'undefined') {
    list = filterStore
  } else {
    list = filterStore.sorted || Array.from(filterStore.stores.values())
    if (process.env.NODE_ENV !== 'production') {
      filterStore.enableMap = true
    }
  }

  return list.map((store, index) => {
    return createElement(ItemSubscription, { key: store.id, store, index })
  })
}

module.exports = {
  useRemoteStore,
  ChannelErrors,
  ClientContext,
  useLocalStore,
  useClient,
  useFilter,
  map
}
