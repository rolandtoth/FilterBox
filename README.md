# FilterBox

FilterBox is a pure JavaScript utility to filter (search) DOM elements.

## Features

- fast CSS-based filtering
- restrict filtering to specific elements (eg. table columns)
- highlight search terms (optional)
- apply to existing DOM input field or add new
- create any number of displays (counters, status texts, etc)
- fine-grained control over created elements (tag, attributes, DOM position)
- add multiple filterboxes to the same target
- auto-update displays on target DOM change (optional)
- callbacks and public methods
- force zebra stripe background (optional)
- lazy init (only on first input focus)
- no dependencies


## Terminology

**Exising DOM elements**

| Name | Description | Required?
| :--- | :--- | :---
| target | The DOM element containing all the items you would like to search. Eg. a container div, a table, an unordered list, etc. | required
| items | DOM elements inside the target that you would like to show/hide, eg. rows of a table. | required
| sources | DOM elements inside items that will be used to match searched terms. If not set, all DOM elements inside the items will be used as data sources. | -

**Newly created elements**

| Name | Description | Required?
| :--- | :--- | :---
| input | This is the main input where you will enter search terms. Can be an existing DOM element too. | required
| wrapper | Element to wrap the main input (eg. for easier CSS styling) | -
| label | Label element to be added to the main input | -
| displays | Additional elements to add to the DOM, eg. counters, status messages, etc | -


## Getting Started

You will need an existing DOM element to apply FilterBox to it. Make sure that you have included `filterbox.js` to the page before initialization, preferably after the DOM target.

There is a helper function `addFilterBox` that accepts an object of options.

### Basic example

The most basic initialization requires the target selector, target items and addTo selector to be set:

```javascript
addFilterBox({
        target: {
            selector: 'table.world-countries',
            items: 'tbody tr'
        }
    }
);
```

This example uses the table with class name `world-countries` as the main target and filter its rows in the tbody. Because the option `addTo` is not set, the filterbox input will be added before (above) the table by default.

### Advanced example

The basic example lacks many features that FilterBox offers, eg. has no displays (counters), no highlighting, no callbacks, zebra striping, etc. The advanced example shows how to add them.


```javascript
var myFilterBox = addFilterBox({
    target: {
        selector: '.world-countries',
        items: 'tbody tr',
        sources:  [
            'td:nth-child(3)'
        ]
    },
    addTo: {
        selector: '.world-countries',
        position: 'before'
    },
    input: {
        label: 'Capital: ',
        attrs: {
            placeholder: 'Search...'
        }
    },
    wrapper: {
        tag: 'div',
        attrs: {
            class: 'filterbox-wrap'
        }
    },
    displays: {
        counter: {
            tag: 'span',
            attrs: {
                class: 'counter'
            },
            addTo: {
                selector: '.filterbox-wrap',
                position: 'append'
            },
            text: function () {
                return '<strong>' + this.getVisible() + '</strong>/' + this.getTotal();
            }
        },
        noresults: {
            tag: 'div',
            addTo: {
                selector: '.world-countries',
                position: 'after'
            },
            text: function () {
                return !this.getVisible() ? 'Sorry, no matching item for "' + this.getFilter() + '"' : '';
            }
        }
    },
    callbacks: {
        onReady: onFilterBoxReady,
        afterFilter: function () {
            this.toggleHide(this.getTarget(), this.isAllItemsHidden());
        }
    },
    highlight: {
        style: 'background: #ff9',
        minChar: 3
    },
    filterAttr: 'data-filter',
    suffix: 'my-filterbox',
    debuglevel: 2,
    inputDelay: 100,
    zebra: true,
    useObserver: false,
    useDomFilter: false
});


function onFilterBoxReady() {
    this.fixTableColumns(this.getTarget());
    this.filter('bras');
    this.focus(true);
}
```

Please check the Options section for more info on the individual options.


## Options



## Callbacks



## Events

### filterboxsearch

On each search the document is triggered with an event called `filterboxsearch`.

Use `e.details` to get the whole FilterBox object instance:

```javascript
document.addEventListener('filterboxsearch', function(e) {
  console.log(e.detail);
});
```

## Contributing

Please report a problem or submit a pull request via GitHub.