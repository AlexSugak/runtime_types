import * as t from 'io-ts'
import * as E from 'fp-ts/Either'

// represents a Date from an ISO string
const DateFromString = new t.Type<Date, string, unknown>(
  'DateFromString',
  (u): u is Date => u instanceof Date, // guard
  (u, c) => // validate
    E.Chain.chain(t.string.validate(u, c), (s) => {
      const d = new Date(s)
      return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d)
    }),
  (a) => a.toISOString() // encode
)

const UserT = t.type({
  name: t.string,
  // new type can be used together with built in types
  registeredAt: DateFromString
})

type User = t.TypeOf<typeof UserT>
// type User = {
//   name: string;
//   registeredAt: Date;
// }

console.log(UserT.decode({
  name: "Alex", 
  registeredAt: '2024-05-20T23:00:00.000Z'
}))
// right: { 
//   name: 'Alex', 
//   registeredAt: new Date('2024-05-20T23:00:00.000Z') 
// }

console.log(UserT.decode({
  name: "Alex", 
  registeredAt: 'foo'
}))
// left: [ ...errors ] 