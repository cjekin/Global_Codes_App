import {addClass} from 'handsontable/helpers/dom/element';
import {stopImmediatePropagation} from 'handsontable/helpers/dom/event';
import {arrayEach, arrayMap} from 'handsontable/helpers/array';
import {isKey} from 'handsontable/helpers/unicode';
import {BaseComponent} from './_base';
import {getOptionsList, FORMULA_NONE} from './../constants';
import {InputUI} from './../ui/input';
import {SelectUI} from './../ui/select';

/**
 * @class ConditionComponent
 * @plugin Filters
 */
class ConditionComponent extends BaseComponent {
  constructor(hotInstance) {
    super(hotInstance);

    this.elements.push(new SelectUI(this.hot));
    this.elements.push(new InputUI(this.hot, {placeholder: 'Value'}));
    this.elements.push(new InputUI(this.hot, {placeholder: 'Second value'}));

    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getSelectElement().addLocalHook('select', (command) => this.onConditionSelect(command));

    arrayEach(this.getInputElements(), (input) => {
      input.addLocalHook('keydown', (event) => this.onInputKeydown(event));
    });
  }

  /**
   * Set state of the component.
   *
   * @param {Object} value State to restore.
   */
  setState(value) {
    this.reset();

    if (value) {
      this.getSelectElement().setValue(value.command);
      arrayEach(value.args, (arg, index) => {
        let element = this.getInputElement(index);

        element.setValue(arg);
        element[value.command.inputsCount > index ? 'show' : 'hide']();
      });
    }
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {Object} Returns object where `command` key keeps used formula filter and `args` key its arguments.
   */
  getState() {
    return {
      command: this.getSelectElement().getValue() || FORMULA_NONE,
      args: arrayMap(this.getInputElements(), (element) => element.getValue()),
    };
  }

  /**
   * Get select element.
   *
   * @returns {SelectUI}
   */
  getSelectElement() {
    return this.elements.filter((element) => element instanceof SelectUI)[0];
  }

  /**
   * Get input element.
   *
   * @param {Number} index Index an array of elements.
   * @returns {InputUI}
   */
  getInputElement(index = 0) {
    return this.getInputElements()[index];
  }

  /**
   * Get input elements.
   *
   * @returns {Array}
   */
  getInputElements() {
    return this.elements.filter((element) => element instanceof InputUI);
  }

  /**
   * Get menu object descriptor.
   *
   * @returns {Object}
   */
  getMenuItemDescriptor() {
    return {
      key: 'filter_by_condition',
      name: '',
      isCommand: false,
      disableSelection: true,
      hidden: () => this.isHidden(),
      renderer: (hot, wrapper, row, col, prop, value) => {
        addClass(wrapper.parentNode, 'htFiltersMenuCondition');

        let label = document.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = 'Filter by condition:';

        wrapper.appendChild(label);
        arrayEach(this.elements, (ui) => wrapper.appendChild(ui.element));

        return wrapper;
      }
    };
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    let lastSelectedColumn = this.hot.getPlugin('filters').getSelectedColumn();
    let columnType = this.hot.getDataType.apply(this.hot, this.hot.getSelected() || [0, lastSelectedColumn]);
    let items = getOptionsList(columnType);

    arrayEach(this.getInputElements(), (element) => element.hide());
    this.getSelectElement().setItems(items);
    super.reset();
    // Select element as default 'None'
    this.getSelectElement().setValue(items[0]);
  }

  /**
   * On condition select listener.
   *
   * @private
   * @param {Object} command Menu item object (command).
   */
  onConditionSelect(command) {
    arrayEach(this.getInputElements(), (element, index) => {
      element[command.inputsCount > index ? 'show' : 'hide']();

      if (!index) {
        setTimeout(() => element.focus(), 10);
      }
    });
  }

  /**
   * Key down listener.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  onInputKeydown(event) {
    if (isKey(event.keyCode, 'ENTER')) {
      this.runLocalHooks('accept');
      stopImmediatePropagation(event);

    } else if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }
  }
}

export {ConditionComponent};
