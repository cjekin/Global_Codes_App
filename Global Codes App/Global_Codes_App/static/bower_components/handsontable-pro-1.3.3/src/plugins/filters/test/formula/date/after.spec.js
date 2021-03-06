describe('Filters formula (`date_after`)', function() {

  it('should filter matching values', function() {
    var formula = getFilterFormula('date_after');
    var data = dateRowFactory({dateFormat: 'DD/MM/YYYY'});

    expect(formula(data('12/05/2015'), ['12/05/2015'])).toBe(true);
    expect(formula(data('12/05/2015'), ['11/05/2015'])).toBe(true);
    expect(formula(data('12/05/2015'), ['11/05/1999'])).toBe(true);
    expect(formula(data('12/05/2015'), ['11-05-1999'])).toBe(true);
    // Invalid format
    expect(formula(data('12/05/2015'), ['2012'])).toBe(false);
  });

  it('should filter not matching values', function() {
    var formula = getFilterFormula('date_after');
    var data = dateRowFactory({dateFormat: 'DD/MM/YYYY'});

    expect(formula(data('12/05/2015'), ['13/05/2015'])).toBe(false);
    expect(formula(data('12/05/2015'), ['05/2015'])).toBe(false);
    expect(formula(data('12/05/2015'), ['2017'])).toBe(false);
  });
});
