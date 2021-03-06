"use strict";

jest.unmock('../fetchCurrentUser.js');

describe('fetchCurrentUser', () => {
  it('calls into $.ajax with the correct params', () => {
    const $ = require('../../lib/jquery-1.12.2.min.js');
    const fetchCurrentUser = require('../fetchCurrentUser');

    // Call into the function we want to test
    const dummyCallback = () => {};
    fetchCurrentUser(dummyCallback);

    // Now make sure that $.ajax was properly called during the previous 2 lines
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://agile-oasis-5771.herokuapp.com/data/careers',
      success: jasmine.any(Function),
    });
  });
});