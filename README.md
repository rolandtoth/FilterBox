# FilterBox

FilterBox is a pure JavaScript utility to filter (search) DOM nodes.

## Features

- fast CSS-based filtering
- restrict filtering to specific nodes (eg. table columns)
- highlight search terms
- apply to existing DOM input field or add new
- create any number of displays (counters, status texts, etc)
- fine-grained control over created nodes (tag, attributes, DOM position)
- add multiple filterboxes to the same target
- auto-update displays on target DOM change
- callbacks and public methods
- force zebra stripe background
- lazy init (only on first input focus)
- no dependencies


## Terminology

**Existing DOM nodes**

| Name | Description | Required?
| :--- | :--- | :---
| target | The DOM node containing all the items you would like to search. Eg. a container div, a table, an unordered list, etc. | required
| items | DOM nodes inside the target that you would like to show/hide, eg. rows of a table. | required
| sources | DOM nodes inside items that will be used to match searched terms. If not set, all DOM nodes inside the items will be used as data sources. | -

**Newly created nodes**

| Name | Description | Required?
| :--- | :--- | :---
| input | This is the main input where you enter the search terms. Can be an existing DOM node too. | required
| wrapper | node to wrap the main input (eg. for easier CSS styling). | -
| label | Label node to be added to the main input. | -
| displays | Additional nodes to add to the DOM, eg. counters, status messages, etc. | -


## Getting Started

You will need an existing DOM node to apply FilterBox to it. Make sure that you have included `filterbox.js` to the page before initialization, preferably after the DOM target.

There is a helper function `addFilterBox` that accepts an object of options.


## Styling

FilterBox comes with no CSS although some styles are added automatically, eg. for filtering and highlighting.

These styles are appended to the HTML head on runtime.


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

This example uses the table with class name `world-countries` as the main target and filter its tbody rows. Because the option `addTo` is not set, the filterbox input will be added before (above) the table by default.

### Advanced example

The basic example lacks many features that FilterBox offers, eg. has no displays (counters), no highlighting, no callbacks etc. The advanced example shows how to add them.


```javascript
var myFilterBox = addFilterBox({
    target: {
        selector: '.world-countries',
        items: 'tbody tr',
        sources: [
            'td:nth-child(3)'
        ]
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
    addTo: {
        selector: '.world-countries',
        position: 'before'
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
                return !this.getVisible() ? 'Sorry, no matching item for "' + this.getFilter() + '".' : '';
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
    enableObserver: false,
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

### target

Here you can define where to search. 

`selector` is a CSS selector of the DOM node, `items` is also a CSS selector to set the items you would like to show/hide. An optional `sources` array can also be set, containing CSS selectors defining the nodes where FilterBox actually searches. If `sources` are not set, all text will be used inside `items`.

If you you would like to filter a table, the target `selector` could be table.world-countries", `items` could be "tbody tr". `sources` could be omitted but if you would like to search in eg. the second column you could set it to `[tr td:nth-child(2)]`.

### input

Obviously you will need an input DOM node to enter search terms. This can be an existing node or a new one. If you set a CSS selector (`selector`) here and it is available in the DOM, FilterBox will use that instead creating one.

You can set attributes for the input with the `attrs` object. Each property of the object will be added to the input, eg. setting `class: "form-input large"` will add two classes, `autocomplete: "off"` will set autocomplete off, and so on.

Optionally you can set a `label` property for the input to prepend a label DOM node to the main input.

### wrapper

You can wrap the main input with a wrapper element which can make CSS styling easier.

`tag` will determine the DOM element type, defaults to "div" if not set. Attributes can be set here too (see "input" above for details).

To add no wrap, omit the wrapper or set it to false.

### addTo

Specifies where to add the main input (or the wrapper, if available) in the DOM.

`selector` is a CSS selector for an existing DOM node and `position` tells whether to add "before", "after" or "prepend" or "append" to this DOM node.

If `addTo` is not set, the main input will be added before the target.

### displays

Displays are newly created DOM elements where you can dynamically modify text, eg. counters, no-result messages, etc.

Each display can be set az an object where you can set `tag`, `attrs`, `addTo` and `text` (see above for the explanations). Their names are irrelevant, eg. "counter" in `counter: {...}` is only used to make it easier to identify them in the code.

The `text` property need to be a function and return a value. Here you can use FilterBox methods to get data from the  FilterBox instance, eg. `this.getVisible()` will return the number of actual visible items, that is, the number of found results. See the "Methods" section below.

You can set as many displays as you need.


## Methods

Inside callbacks and `text` properties of displays you can use public methods of the current FilterBox instance, available through `this`. 

You can also use these methods after initializing a FilterBox instance, eg.:

```javascript
var myFilterBox = addFilterBox({...})
console.log(myFilterBox.getTotal());
```

Tip: you can get the FilterBox instance through the main input's `getFilterBox()` method, eg. if you would like to use in third party libraries:

```javascript
document.querySelector('input.myfilterbox').getFilterBox().filter('hello');
```

### getVisible()

Returns the number of currently unfiltered (visible) items.

### getTotal()

Returns the total number of items.

## setZebra()

Unfortunately CSS `nth-child` does not work well with FilterBox as items are not removed from the DOM but only made hidden, so zebra striping will fail.

To overcome this, call setZebra() to re-add striping.

FilterBox will do this automatically internally, you will need to do it only if the main target is modified from outside.


## Callbacks

Callbacks run when a certain event happens in the FilterBox instance, eg. when initialization has finished and it's ready (`onReady`), before filtering (`beforeFilter`) or after destroy (`afterDestroy`).

In callbacks `onInit`, `beforeFilter` and `beforeDestroy` if your function returns false, FilterBox will stop. For example you can prevent creating a FilterBox instance if a certain condition is met with `onInit` (eg. the main target contains only 5 items), or prevent further filtering in `beforeFilter`, eg. if the current search term is "bazinga".

## Events

Currently there is only one event called `filterboxsearch` that is emitted on the document after each filter.

Use `e.details` to get the whole FilterBox object instance:

```javascript
document.addEventListener('filterboxsearch', function(e) {
  console.log(e.detail);
});
```

## MutationObserver

When setting `enableObserver` to true, all FilterBox displays will react if the number of the items or their text changes.

Eg. if another scripts removes some rows from the target table, a counter will be automatically updated to show the correct number of visible or total items.

Or you have filtered for "spaghetti" and a script adds more "spaghetti"'s to other items, those will be automatically visible too.

## Contributing

You can report a problem or submit a PR via GitHub.
