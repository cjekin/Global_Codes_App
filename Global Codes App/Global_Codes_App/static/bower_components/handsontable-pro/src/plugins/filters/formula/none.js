import {registerFormula} from './../formulaRegisterer';

export const FORMULA_NAME = 'none';

function formula() {
  return true;
}

registerFormula(FORMULA_NAME, formula);
