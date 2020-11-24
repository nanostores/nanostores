let {
  Component,
  createContext,
  useContext,
  useState,
  useEffect,
  createElement
} = require('react')

let { loading, loaded, emitter, listeners, destroy } = require('../store')

let ClientContext = createContext()
let ErrorsContext = createContext()

function useLocalStore (StoreClass) {
  let client = useContext(ClientContext)
  let [, forceRender] = useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (!client) {
      throw new Error('Wrap components in Logux <ClientContext.Provider>')
    }
  }

  let instance = client.objects.get(StoreClass)
  if (!instance) {
    instance = new StoreClass(client)
    if (process.env.NODE_ENV !== 'production') {
      if (instance[loading]) {
        throw new Error(
          `${StoreClass.name} is a remote store and need to be load ` +
            'with useRemoteStore()'
        )
      }
    }
    client.objects.set(StoreClass, instance)
  }

  useEffect(() => {
    instance[listeners] += 1
    let unbind = instance[emitter].on('change', () => forceRender({}))
    return () => {
      unbind()
      instance[listeners] -= 1
      if (!instance[listeners]) {
        setTimeout(() => {
          if (!instance[listeners] && client.objects.has(StoreClass)) {
            client.objects.delete(StoreClass)
            if (instance[destroy]) instance[destroy]()
          }
        }, 10)
      }
    }
  }, [StoreClass])

  return instance
}

function useRemoteStore (StoreClass, id) {
  let client = useContext(ClientContext)
  let [, forceRender] = useState({})
  let [error, setError] = useState(null)

  if (process.env.NODE_ENV !== 'production') {
    if (!client) {
      throw new Error('Wrap the component in Logux <ClientContext.Provider>')
    }
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

  if (error) throw error

  let instance = client.objects.get(id)
  if (!instance) {
    instance = new StoreClass(client, id)
    if (process.env.NODE_ENV !== 'production') {
      if (!instance[loading]) {
        throw new Error(
          `${StoreClass.name} is a local store and need to be created ` +
            'with useLocalStore()'
        )
      }
    }
    client.objects.set(id, instance)
  }

  let [isLoading, setLoading] = useState(!instance[loaded])

  useEffect(() => {
    setLoading(!instance[loaded])
    instance[listeners] += 1
    let unbind
    if (instance[loaded]) {
      unbind = instance[emitter].on('change', () => forceRender({}))
    } else {
      instance[loading]
        .then(() => {
          unbind = instance[emitter].on('change', () => forceRender({}))
          setLoading(false)
        })
        .catch(e => {
          setError(e)
        })
    }
    return () => {
      if (unbind) unbind()
      instance[listeners] -= 1
      if (!instance[listeners]) {
        setTimeout(() => {
          if (!instance[listeners] && client.objects.has(id)) {
            client.objects.delete(id)
            if (instance[destroy]) instance[destroy]()
          }
        }, 10)
      }
    }
  }, [StoreClass, id])

  instance.isLoading = isLoading

  if (process.env.NODE_ENV !== 'production') {
    let loadingChecked = false
    let proxy = new Proxy(instance, {
      get (target, prop) {
        if (prop === 'isLoading') {
          loadingChecked = true
        }
        if (
          !loadingChecked &&
          typeof instance[prop] !== 'function' &&
          prop !== 'id'
        ) {
          throw new Error(
            'You need to check `store.isLoading` before calling any properties'
          )
        } else {
          return instance[prop]
        }
      }
    })
    return proxy
  }

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

module.exports = { ChannelErrors, ClientContext, useLocalStore, useRemoteStore }
