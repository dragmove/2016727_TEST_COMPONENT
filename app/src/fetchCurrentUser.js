"use strict";

const $ = require('../lib/jquery-1.12.2.min.js');

function fetchCurrentUser(callback) {
  return $.ajax({
    type: 'GET',
    url: 'http://agile-oasis-5771.herokuapp.com/data/careers',
    success: data => callback(data),
  });
}

module.exports = fetchCurrentUser;