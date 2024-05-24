import * as S from 'io-ts/Schema'

// same as type, but interpretable separately
const UserT = S.make((S) =>
  S.struct({
    name: S.string,
    age: S.number,
  }),
)
type User = S.TypeOf<typeof UserT>

import * as D from 'io-ts/Decoder'
import * as Eq from 'io-ts/Eq'

export const decodeUser = S.interpreter(D.Schemable)(UserT)
export const eqUser = S.interpreter(Eq.Schemable)(UserT)


// this function has a problem!
const findOldestAge = (users: User[]): number => {
  const oldestUser = users.reduce(
    (u, acc) => u.age > acc.age ? u : acc, 
    users[0])
  return oldestUser.age
}

import * as Arb from './arbitrary' // 160 LoC
import fc from 'fast-check'

const userArb = S.interpreter(Arb.Schemable)(UserT)

// verify that findOldestAge never throws
fc.assert(
  fc.property(fc.array(userArb), (randomUsers: User[]) => {
    findOldestAge(randomUsers)
  }),
)

// Error: Property failed after 10 tests
// { seed: 55396323, path: "9", endOnFailure: true }
// Counterexample: [[]]
// Shrunk 0 time(s)
// Got TypeError: Cannot read properties of undefined (reading 'age')
//     at ...

