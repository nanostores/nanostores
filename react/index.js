let {
  createContext,
  createElement,
  useContext,
  Component,
  useEffect,
  useState
} = require('react')

let ClientContext = createContext()
let ErrorsContext = createContext()

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
    return instance.subscribe(() => {
      forceRender({})
    })
  }, [StoreClass])
  return instance
}

function useRemoteStore (StoreClass, id) {
  let client = useContext(ClientContext)
  let [, forceRender] = useState({})
  let [error, setError] = useState(null)

  if (error) throw error

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
    let unbind = instance.subscribe(() => {
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

module.exports = {
  useRemoteStore,
  ChannelErrors,
  ClientContext,
  useLocalStore,
  useClient
}
