import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import * as E from 'fp-ts/Either'

const UserT = t.type({
  name: t.string,
  age: t.number,
})
type User = t.TypeOf<typeof UserT>

function decodeUser(data: unknown): User {
  const decoded = UserT.decode(data)
  if (E.isLeft(decoded)) {
    throw Error(`Could not parse data: 
      ${PathReporter.report(decoded).join('\n')}`,
    )
  }
  return decoded.right
} 

const correctData: unknown = 
  { name: "Alex", age: 39 }
console.log(decodeUser(correctData))
// > { name: 'Alex', age: 39 }

const wrongData: unknown = 
  { name: "Alex", age: "too old" }
console.log(decodeUser(wrongData))
// > Error: Could not parse data: 
//   Invalid value "too old" supplied to : 
//   { name: string, age: number }/age: number

try {
  decodeUser(wrongData)
} catch (e) {
  console.log(e)
}
