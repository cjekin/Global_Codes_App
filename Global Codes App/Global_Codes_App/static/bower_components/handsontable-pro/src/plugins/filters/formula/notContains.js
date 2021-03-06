import {registerFormula, getFormula} from './../formulaRegisterer';
import {FORMULA_NAME as FORMULA_CONTAINS} from './contains';

export const FORMULA_NAME = 'not_contains';

function formula(dataRow, inputValues) {
  return !getFormula(FORMULA_CONTAINS, inputValues)(dataRow);
}

registerFormula(FORMULA_NAME, formula);
