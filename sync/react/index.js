import React from 'react'

import { createFilter } from '../create-filter/index.js'
import { getValue } from '../../get-value/index.js'

export let ClientContext = /*#__PURE__*/ React.createContext()

let ErrorsContext = /*#__PURE__*/ React.createContext()

export function useClient() {
  return React.useContext(ClientContext)
}

function useSyncStore(store) {
  let [error, setError] = React.useState(null)
  let [, forceRender] = React.useState({})

  let value
  if (process.env.NODE_ENV === 'production') {
    value = getValue(store)
  } else {
    try {
      value = getValue(store)
    } catch (e) {
      if (e.message === 'Missed Logux client') {
        throw new Error('Wrap components in Logux <ClientContext.Provider>')
      } else {
        throw e
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    let errorProcessors = React.useContext(ErrorsContext) || {}
    if (
      !errorProcessors.Error &&
      (!errorProcessors.NotFound || !errorProcessors.AccessDenied)
    ) {
      throw new Error(
        'Wrap components in Logux ' +
          '<ChannelErrors NotFound={Page404} AccessDenied={Page403}>'
      )
    }
  }

  React.useEffect(() => {
    let batching
    let unbind = store.listen(() => {
      if (batching) return
      batching = 1
      setTimeout(() => {
        batching = undefined
        forceRender({})
      })
    })

    if (store.loading) {
      store.loading.catch(e => {
        setError(e)
      })
    }

    return unbind
  }, [store])

  if (error) throw error
  return value
}

export function useSync(Builder, id, ...builderArgs) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof Builder !== 'function') {
      throw new Error('Use useStore() from @logux/state/react for stores')
    }
  }

  let client = useClient()
  let store = Builder(id, client, ...builderArgs)

  return useSyncStore(store)
}

export function useFilter(Builer, filter = {}, opts = {}) {
  let client = useClient()
  let instance = createFilter(client, Builer, filter, opts)
  return useSyncStore(instance)
}

let ErrorsCheckerProvider = ({ children, ...props }) => {
  let prevErrors = React.useContext(ErrorsContext) || {}
  let errors = { ...props, ...prevErrors }
  return React.createElement(
    ErrorsContext.Provider,
    { value: errors },
    children
  )
}

export class ChannelErrors extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    let error = this.state.error
    let h = React.createElement
    if (!error) {
      if (process.env.NODE_ENV === 'production') {
        return this.props.children
      } else {
        return h(ErrorsCheckerProvider, this.props)
      }
    } else if (error.name !== 'LoguxUndoError') {
      throw error
    } else if (error.action.reason === 'notFound') {
      if (this.props.NotFound) {
        return h(this.props.NotFound, { error })
      } else if (this.props.Error) {
        return h(this.props.Error, { error })
      } else {
        throw error
      }
    } else if (error.action.reason === 'denied') {
      if (this.props.AccessDenied) {
        return h(this.props.AccessDenied, { error })
      } else if (this.props.Error) {
        return h(this.props.Error, { error })
      } else {
        throw error
      }
    } else if (this.props.Error) {
      return h(this.props.Error, { error })
    } else {
      throw error
    }
  }
}
