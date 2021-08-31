import { createMap } from '../index.js'

let test = createMap<
  { id: string; isLoading: true } | { isLoading: false; a: string; b: number }
>()

test.subscribe((value, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS always return 'false' since the types '"id" | "b" | "a"
  if (changedKey === 'c') {
  }
})
