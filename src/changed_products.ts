import * as SC from 'io-ts/Schema'
import * as SA from 'io-ts/Schemable'
import * as D from 'io-ts/Decoder'
import * as Eq from 'io-ts/Eq'
import { pipe, unsafeCoerce } from 'fp-ts/lib/function'
import { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/lib/HKT'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

/**
 * A sample code that demostrates using IO-TS and FP-TS libraries in a real-world setting.
 * 
 * Scenario:
 * Integration between e-commerce platform and a 3rd party service
 * that injests incoming product information updates:
 * - 3rd party sends us the latest "raw" product data
 * - we decode the "message" into a type-safe values
 * - then we compare the data to existing data to detect changes
 * 
 * Demonstrating:
 * - Usage of IO-TS Schema and Schemable abstractions
 * - Extending default schema with custom types
 * - Decoding raw data using decoder intepreted from data Schema
 * - Using Equality checker intepreted from data Schema
 * - Using FP-TS pipe/Array/Either/Option and other abstractions
 */

// ------------ Extending default schema ------------

// a custom Price type we will use to encode/decode price value + currency
export type Currency = 'USD' | 'EUR'
export type Price = { value: number, currency: Currency }

// base type class definition
export interface MySchemable<S> extends SA.Schemable<S> {
  readonly Price: HKT<S, Price>
}

// type class definition for * -> * constructors (e.g. `Eq`, `Guard`)
export interface MySchemable1<S extends URIS> extends SA.Schemable1<S> {
  readonly Price: Kind<S, Price>
}

// type class definition for * -> * -> * constructors (e.g. `Decoder`, `Encoder`)
export interface MySchemable2C<S extends URIS2> extends SA.Schemable2C<S, unknown> {
  readonly Price: Kind2<S, unknown, Price>
}

export interface MySchema<A> {
  <S>(S: MySchemable<S>): HKT<S, A>
}

export function make<A>(f: MySchema<A>): MySchema<A> {
  return SA.memoize(f)
}

export type TypeOf<S> = S extends MySchema<infer A> ? A : never

// ------------ Decoder and Equality checker  ------------

// extend default decoder to decode prices
export const myDecoderSchemable: MySchemable2C<D.URI> = {
  ...D.Schemable,
  Price: pipe(
    D.string,
    D.parse((p) => {
      const match = p.match(/^(USD|EUR)(\d+(?:\.\d{1,2})?)$/)
      if (match) {
        return D.success({ currency: match[1] as Currency, value: parseFloat(match[2]) } as Price)
      }
      return D.failure(p, '^(USD|EUR)(\d+(?:\.\d{1,2})?)$')
    })
  )
}

// extend default equality check to compare prices
export const myEqSchemable: MySchemable1<Eq.URI> = {
  ...Eq.Schemable,
  Price: Eq.struct({ value: Eq.number, currency: Eq.string })
}

export const myInterpreter: {
  <S extends URIS2>(S: MySchemable2C<S>): <A>(schema: MySchema<A>) => Kind2<S, unknown, A>
  <S extends URIS>(S: MySchemable1<S>): <A>(schema: MySchema<A>) => Kind<S, A>
} = unsafeCoerce(SC.interpreter)

// ------------ Our Schema  ------------

const ProductT = make((S) =>
  S.struct({
    id: S.number,
    name: S.string,
    color: S.literal('white', 'black', 'green'), // union
    price: S.Price // using our custom type to parse prices
  }),
)

// final Product type
type Product = TypeOf<typeof ProductT>

// final custom decoder function
export const productD = myInterpreter(myDecoderSchemable)(ProductT)
// final custom equality check function
export const productEq = myInterpreter(myEqSchemable)(ProductT)
// TODO: fast-check arbitraries and any other derived from schema behavior we may need

// ------------ Testing ------------

// raw data we get from some IO (API response, queue message etc.)
// the data is correct by default
// you can try and changing it to trigger a parsing error, e.g. try and change the currency to an unsupported value
const rawInputData: unknown[] = [
  { id: 234, name: 'T-Shirt', color: 'black', price: 'EUR12' },
  { id: 345, name: 'T-Shirt', color: 'white', price: 'EUR15' },
  { id: 456, name: 'Pants', color: 'white', price: 'EUR56' },
  { id: 567, name: 'Jacket', color: 'green', price: 'EUR120.65' },
]

// existing data we previously processed, e.g. coming from a database
const existingData: Product[] = [
  { id: 234, name: 'T-Shirt', color: 'black', price: {currency: 'EUR', value: 12 } },
  { id: 345, name: 'T-Shirt', color: 'white', price: {currency: 'EUR', value: 16 } },
  { id: 456, name: 'Pants', color: 'white', price: {currency: 'EUR', value: 57 } },
  { id: 567, name: 'Jacket', color: 'green', price: {currency: 'EUR', value: 120.65} },
]

// let's find all the products that have updated data compared to the existing data
const updatedProducts = pipe(
  rawInputData,// take uknown values array as input
  A.map(productD.decode), // try decode all values 
  A.sequence(E.Applicative), // flatten the list: (error | Product)[] -> error | Product[] 
  E.map(products => { // find all corresponding products in existing data
    return pipe(
      products,
      A.map<Product, [Product, O.Option<Product>]>(p => ([
        p, 
        pipe(existingData, A.findFirst(ep => ep.id === p.id))]))
    )
  }),
  E.map(pp => pipe(// find all products that do not match existing product
    pp,
    A.filter(([p, ep]) => 
      O.isNone(ep) || // we either don't have an existing product, i.e. incoming product is a new one
      pipe(ep, O.exists(ep => !productEq.equals(ep, p))) // or existing product differs from incoming one 
    ),
    A.map(([p, _]) => p) // only return incoming parsed product
  ))
)

if (E.isLeft(updatedProducts)) {
  console.log('Error parsing products data:', D.draw(updatedProducts.left))
} else {
  console.log('Found updated products:', updatedProducts.right)
}
