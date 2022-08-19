'use strict';

module.exports = {
  '*.md': ['prettier --write'],
  '*.{json,js,ts,tsx}': ['eslint --fix', 'prettier --write'],
};