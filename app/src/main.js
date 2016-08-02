import React, { Component } from 'react';
import { render } from 'react-dom';

import HelloWorld from './components/HelloWorld'

class App extends Component {
    render() {
        return (
            <div>
                <HelloWorld />
            </div>
        );
    }
}

(function($) {
  "use strict";
  $(document).ready(init);

  function init() {
    render(
        <App />,
        $('#wrapper').get(0)
    );
  }
}(jQuery));