import {objectEach, deepClone} from 'handsontable/helpers/object';
import {arrayEach} from 'handsontable/helpers/array';
import {DateCalculator} from './dateCalculator';

/**
 * This class handles the data-related calculations for the GanttChart plugin.
 *
 * @plugin GanttChart
 */
class GanttChartDataFeed {
  constructor(chartInstance, data, startDateColumn, endDateColumn, additionalData) {
    this.data = data;
    this.chartInstance = chartInstance;
    this.chartPlugin = this.chartInstance.getPlugin('ganttChart');
    this.hotSource = null;

    this.applyData(data, startDateColumn, endDateColumn, additionalData);
  }

  /**
   * Parse data accordingly to it's type (HOT instance / data object).
   *
   * @param {Object} data The source Handsontable instance or a data object.
   * @param {Number} startDateColumn Index of the column containing the start dates.
   * @param {Number} endDateColumn Index of the column containing the end dates.
   * @param {Object} additionalData Object containing column and label information about additional data passed to the Gantt Plugin.
   */
  applyData(data, startDateColumn, endDateColumn, additionalData) {
    if (Object.prototype.toString.call(data) === '[object Array]') {
      this.loadData(data);

      // if data is a Handsontable instance (probably not the best way to recognize it)
    } else if (data.guid) {
      this.bindWithHotInstance(data, startDateColumn, endDateColumn, additionalData);
    }
  }

  /**
   * Make another Handsontable instance be a live feed for the gantt chart.
   *
   * @param {Object} instance The source Handsontable instance.
   * @param {Number} startDateColumn Index of the column containing the start dates.
   * @param {Number} endDateColumn Index of the column containing the end dates.
   * @param {Object} additionalData Object containing column and label information about additional data passed to the
   * Gantt Plugin. See the example for more details.
   *
   * @example
   * ```js
   * hot.getPlugin('ganttChart').bindWithHotInstance(sourceInstance, 4, 5, {
   *  vendor: 0, // data labeled 'vendor' is stored in the first sourceInstance column.
   *  format: 1, // data labeled 'format' is stored in the second sourceInstance column.
   *  market: 2 // data labeled 'market' is stored in the third sourceInstance column.
   * });
   * ```
   */
  bindWithHotInstance(instance, startDateColumn, endDateColumn, additionalData) {
    this.hotSource = {
      instance: instance,
      startColumn: startDateColumn,
      endColumn: endDateColumn,
      additionalData: additionalData
    };

    this.addSourceHotHooks();

    this.updateFromSource();
  }

  /**
   * Add hooks to the source Handsontable instance.
   *
   * @private
   */
  addSourceHotHooks() {
    this.hotSource.instance.addHook('afterLoadData', (firstRun) => this.onAfterSourceLoadData(firstRun));
    this.hotSource.instance.addHook('afterChange', (changes, source) => this.onAfterSourceChange(changes, source));
    this.hotSource.instance.addHook('afterColumnSort', (column, order) => this.onAfterColumnSort(column, order));
  }

  /**
   * Remove hooks from the source Handsontable instance.
   *
   * @private
   * @param {Object} hotSource The source Handsontable instance object.
   */
  removeSourceHotHooks(hotSource) {
    hotSource.instance.removeHook('afterChange', (changes, source) => this.onAfterSourceChange(changes, source));
    hotSource.instance.removeHook('afterColumnSort', (column, order) => this.onAfterColumnSort(column, order));
  }

  /**
   * Get data from the source Handsontable instance.
   *
   * @param {Number} [row] Source Handsontable instance row.
   * @returns {Array}
   */
  getDataFromSource(row) {
    let additionalObjectData = {};
    let hotSource = this.hotSource;
    let sourceHotRows;
    let rangeBarData = [];

    if (row === void 0) {
      sourceHotRows = hotSource.instance.getData(0, 0, hotSource.instance.countRows() - 1, hotSource.instance.countCols() - 1);

    } else {
      sourceHotRows = [];
      sourceHotRows[row] = hotSource.instance.getDataAtRow(row);
    }

    for (let i = row || 0, dataLength = sourceHotRows.length; i < (row ? row + 1 : dataLength); i++) {
      additionalObjectData = {};
      let currentRow = sourceHotRows[i];

      if (currentRow[hotSource.startColumn] === null || currentRow[hotSource.startColumn] === '') {
        continue;
      }

      objectEach(hotSource.additionalData, (prop, j) => {
        additionalObjectData[j] = currentRow[prop];
      });

      rangeBarData.push([
        i, currentRow[hotSource.startColumn],
        currentRow[hotSource.endColumn], additionalObjectData, i]);
    }

    return rangeBarData;
  }

  /**
   * Update the Gantt Chart-enabled Handsontable instance with the data from the source Handsontable instance.
   *
   * @param {Number} [row] Index of the row which needs updating.
   */
  updateFromSource(row) {
    let dataFromSource = this.getDataFromSource(row);

    if (!row && isNaN(row)) {
      this.chartPlugin.clearRangeBars();
      this.chartPlugin.clearRangeList();
    }

    arrayEach(dataFromSource, (bar) => {
      bar = this.trimRangeIfNeeded(bar);
      this.chartPlugin.addRangeBar.apply(this.chartPlugin, bar);
    });
  }

  /**
   * Load chart data to the Handsontable instance.
   *
   * @param {Array} data Array of objects containing the range data.
   *
   * @example
   * ```js
   * [
   *  {
   *    additionalData: {vendor: 'Vendor One', format: 'Posters', market: 'New York, NY'},
   *    startDate: '1/5/2015',
   *    endDate: '1/20/2015'
   *  },
   *  {
   *    additionalData: {vendor: 'Vendor Two', format: 'Malls', market: 'Los Angeles, CA'},
   *    startDate: '1/11/2015',
   *    endDate: '1/29/2015'
   *  }
   * ]
   * ```
   */
  loadData(data) {
    arrayEach(data, (bar, i) => {
      bar = this.trimRangeIfNeeded(bar);
      this.chartPlugin.addRangeBar(i, bar.startDate, bar.endDate, bar.additionalData);
    });
  }

  /**
   * Trim the dates in the provided range bar, if they exceed the currently processed year.
   *
   * @param {Array} bar Range bar data.
   * @returns {Array}
   */
  trimRangeIfNeeded(bar) {
    let startDate = new Date(bar[1]);
    let endDate = new Date(bar[2]);

    if (typeof startDate === 'string' || typeof endDate === 'string') {
      return false;
    }

    let startYear = startDate.getFullYear();
    let endYear = endDate.getFullYear();

    if (startYear < this.chartPlugin.currentYear && endYear >= this.chartPlugin.currentYear) {
      bar[1] = '01/01/' + this.chartPlugin.currentYear;
    }

    if (endYear > this.chartPlugin.currentYear && startYear <= this.chartPlugin.currentYear) {
      bar[2] = '12/31/' + this.chartPlugin.currentYear;
    }

    return bar;
  }

  /**
   * afterChange hook callback for the source Handsontable instance.
   *
   * @private
   * @param {Array} changes List of changes.
   * @param {String} source Change source.
   */
  onAfterSourceChange(changes, source) {
    if (!changes) {
      return;
    }

    let changesByRows = {};

    for (let i = 0, changesLength = changes.length; i < changesLength; i++) {
      let currentChange = changes[i];
      let row = parseInt(currentChange[0], 10);
      let col = parseInt(currentChange[1], 10);

      if (!changesByRows[row]) {
        changesByRows[row] = {};
      }

      changesByRows[row][col] = [currentChange[2], currentChange[3]];
    }

    objectEach(changesByRows, (prop, i) => {
      i = parseInt(i, 10);

      if (this.chartPlugin.getRangeBarCoordinates(i)) {
        this.chartPlugin.removeRangeBarByColumn(i, this.chartPlugin.rangeList[i][1]);
      }

      this.updateFromSource(i);
    });
  }

  /**
   * afterLoadData hook callback for the source Handsontable instance.
   *
   * @private
   * @param firstRun
   */
  onAfterSourceLoadData(firstRun) {
    this.chartPlugin.removeAllRangeBars();
    this.updateFromSource();
  }

  /**
   * afterColumnSort hook callback for the source Handsontable instance.
   *
   * @private
   * @param {Number} column Sorted column.
   * @param order
   */
  onAfterColumnSort(column, order) {
    this.chartPlugin.removeAllRangeBars();
    this.updateFromSource();
  }
}

export {GanttChartDataFeed};
