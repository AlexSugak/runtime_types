import * as t from 'io-ts'

// primitives

// --------------------------

    declare const nl: null

    declare const s: string

    declare const n: number

// --------------------------

    const ioNl = t.null

    const ioS = t.string

    const ioN = t.number

// --------------------------

// composition--------------------
// -------------------------------

    declare const obj: {
      name: string
      age: number
    }

    declare const p: 
      { a: string } & 
      { b: number }


    declare const u: 'Foo' | 'Bar'




// -------------------------------

    const ioObj = t.type({
      name: t.string,
      age: t.number,
    })

    const ioP = t.intersection([
      t.type({ a: t.string }), 
      t.type({ b: t.number })
    ])

    const ioU = t.union([
      t.literal('Foo'), 
      t.literal('Bar')]
    )

// -------------------------------

    type ioObjT = t.TypeOf<typeof ioObj>
    // type ioObjT = {
    //   name: string;
    //   age: number;
    // }

    type ioPT = t.TypeOf<typeof ioP>
    // type ioPT = {
    //   a: string;
    // } & {
    //   b: number;
    // }

    type ioUT = t.TypeOf<typeof ioU>
    // type ioUT = "Foo" | "Bar"

// -------------------------------