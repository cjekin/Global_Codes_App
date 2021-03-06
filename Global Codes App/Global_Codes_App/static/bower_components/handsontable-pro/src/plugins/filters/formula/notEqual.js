import {registerFormula, getFormula} from './../formulaRegisterer';
import {FORMULA_NAME as FORMULA_EQUAL} from './equal';

export const FORMULA_NAME = 'neq';

function formula(dataRow, inputValues) {
  return !getFormula(FORMULA_EQUAL, inputValues)(dataRow);
}

registerFormula(FORMULA_NAME, formula);
