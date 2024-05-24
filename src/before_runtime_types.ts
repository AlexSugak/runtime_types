
// TS type guards
function isNumber(x: unknown): x is number {
  return typeof x === 'number'
}

['a', 3, 'b', 7]
  .filter(isNumber)
  .map((n: number) => n / 2)


// Yup for forms validation
import * as Yup from 'yup'

const SignupSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'Too Short!')
    .required('Required'),
  lastName: Yup.string()
    .min(2, 'Too Short!')
    .required('Required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
})

