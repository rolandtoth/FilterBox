# FilterBox

FilterBox is a pure JavaScript utility to filter (search) DOM nodes.

[View Demo](https://rawcdn.githack.com/rolandtoth/FilterBox/689da57/examples/advanced.html)

## Features

- fast CSS-based filtering
- highlight search terms
- restrict filtering to specific nodes (eg. table columns)
- apply to existing DOM input field or add new
- create any number of displays (counters, status texts, etc)
- fine-grained control over created nodes (tag, attributes, DOM position)
- add multiple filterboxes to the same target
- auto-update displays on target DOM change
- callbacks and public methods
- force zebra stripe background
- lazy init (only on first input focus)
- invert filtering (with "!" character)
- no dependencies


## How FilterBox works

FilterBox adds a HTML input to the DOM to filter elements inside a target DOM container.

On first focus on the input will add `data-filterbox` attributes to the items and fill them with their textual contents.

When typing into the input FilterBox updates a CSS style block in the HTML head that will hide or show items in the main items.

This search method is very fast because only one DOM element needs to be updated on each keystroke, even if there are hundreds or thousands of items to filter.

**Notes:**

- browsers will render results slower if the amount of items is very large
- FilterBox has a highlight feature that doesn't play nicely with large data so you may need to disable it when experiencing issues


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
| label | Label node to insert before the main input. | -
| displays | Additional nodes to add to the DOM, eg. counters, status messages, etc. | -


## Getting Started

You will need an existing DOM node to apply FilterBox to it. Make sure that you have included `filterbox.js` to the page before initialization, preferably after the DOM target.

There is a helper function `addFilterBox` that accepts an object of options. This function returns the FilterBox object instance on success, otherwise returns false.

After initialization you can access the FilterBox instance whether by its handle (if assigned to a variable) or through the `getFilterBox()` method on the main input (see the Methods section below for more info).


## Styling

FilterBox comes with no CSS although some internal styles are added automatically to the DOM, eg. for filtering and highlighting. These styles are appended to the HTML head on runtime.


## Basic example

The most basic initialization requires a target selector and target items selector to set:

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

Note: FilterBox adds search terms to the items' `data-filter` attribute only on the first focus (click) on the main input. This way it doesn't uses CPU in vain, only when it's really needed. You can disable this by setting `lazy` to `false` in the options.

## Advanced example

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
                return '<strong>' + this.countVisible() + '</strong>/' + this.countTotal();
            }
        },
        noresults: {
            tag: 'div',
            addTo: {
                selector: '.world-countries',
                position: 'after'
            },
            text: function () {
                return !this.countVisible() ? 'Sorry, no matching item for "' + this.getFilter() + '".' : '';
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
    suffix: 'my-fbx',
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

See the Options section below for more info on the individual options.


## Options

### addTo

Specifies where to add the main input (or the wrapper, if available) in the DOM.

`selector` is a CSS selector for an existing DOM node and `position` tells whether to add "before", "after" or "prepend" or "append" to this DOM node.

If `addTo` is not set, the main input will be added before the target.

### callbacks

An object containing the callback functions, see the Callbacks section below.

### debuglevel

If your FilterBox doesn't show up, set this option to 1 for a simple or 2 for a detailed info that prevented FilterBox to start.

The messages will appear in the developer tools console.

### displays

Displays are DOM elements created by FilterBox where you can dynamically modify text. Suitable for example counters, no-result messages, etc.

Each display can be set az an object where you can set `tag`, `attrs`, `addTo` and `text` (see above for the explanations).

Their names are irrelevant, eg. "counter" in `counter: {...}` is only used to make it easier to identify them in the code.

The `text` property need to be a function and return a value.

Here you can use FilterBox methods to get data from the  FilterBox instance, eg. `this.countVisible()` will return the number of actual visible items, that is, the number of found results. See the "Methods" section below.

You can set as many displays as you need.

### filterAttr

If you would like to set the name of the data-attribute FilterBox uses for filtering you can set it here. The `suffix` will be appended, if available.

If `useDomFilter` (see below) is set to true then FilterBox will not add data-filter attributes but will use existing ones available on target items.

### highlight

If present, FilterBox will highlight the searched term in the main target.

`style` is a CSS rule to use for highlighting, eg. `background: yellow`
`minChar` number of characters when highlight needs to be used. Recommended to set a value of 2 or more.

### input

The input element to enter search terms. This can be an existing node or a new one that FilterBox creates.

If you set a CSS selector (`selector`) here and such element is available in the DOM, FilterBox will use that, otherwise adds a new one.

You can set attributes for the input with the `attrs` object.

Each property of the object will be added to the input, eg. setting `class: "form-input large"` will add two classes, `autocomplete: "off"` will set autocomplete off, and so on.

Optionally you can set a `label` property for the input to prepend a label DOM node to the main input.

### inputDelay

Time in milliseconds to delay triggering filtering (default: 300).

Increase this value if experiencing slow filtering, eg. on heavier DOM target.

### extraFilterAttrs

An array of data attributes (or selectors with data-attributes) whose values you would like to add to the filter keywords.

This way you can add additional keywords to match items, even they don't appear in the HTML.

For example, if your target items are table rows, then:

```javascript
extraFilterAttrs: [
  'data-email',
  'td[data-email]',
  '[data-email]'
]
```

- attribute name only: get value from the item itself (on `tr` elements in this example)
- selector with attribute: values will be gathered from the items's descendants (on `td` elements that has `data-email` attributes here)

Note that when an extra filter attribute is matched, highlighting may not available as there's no visible HTML element to use.

### suffix

Here you can set a suffix that will be appended to varius data-attributes FilterBox uses to avoid collision with other existing attributes.

### target

Here you can define where to search. 

`selector` is a CSS selector of the DOM node, `items` is also a CSS selector to set the items you would like to show/hide.

An optional `sources` array can also be set, containing CSS selectors defining the nodes where FilterBox actually searches.

If `sources` are not set, all text will be used inside `items`.

If you would like to filter a table, the target `selector` could be table.world-countries", `items` could be "tbody tr".

`sources` could be omitted but if you would like to search in eg. the second column you could set it to `[tr td:nth-child(2)]`.

### useDomFilter

FilterBox adds data-filter attributes automatically and fills with text found in items but if you would like to use existing data-filter, set this to `true`.

This can be handy if you would like to filter items differently, eg. adding tags with a backend language, etc.

You will also need to adjust the `filterAttr` to match your attribute's name.

### zebra

Whether to enable or disable adding `data-odd` (+ suffix) attribute to the items with value 1 or 0.

This helps keeping zebra striping when eg. the order of items inside the main target changes.

Use the method setZebra() to re-add this attribute to items.

### wrapper

You can wrap the main input with a wrapper element which can make CSS styling easier.

`tag` will determine the DOM element type, defaults to "div" if not set. Attributes can be set here too (see "input" above for details).

To add no wrap, omit the wrapper or set it to false.


## Methods

Inside callbacks and `text` properties of displays you can use public methods of the current FilterBox instance, available through `this`. 

You can also use these methods after initializing a FilterBox instance, eg.:

```javascript
var myFilterBox = addFilterBox({...})
console.log(myFilterBox.countTotal());
```

Tip: you can get the FilterBox instance through the main input's `getFilterBox()` method, eg. if you would like to use in third party libraries:

```javascript
document.querySelector('input.myfilterbox').getFilterBox().filter('hello');
```

### fixTableColumns(table)

*Parameters: table (DOM element, required)*

If the main target is a table, this helper function will set the widths of `th` nodes using inline style.

The purpose is to fix column widths so on filtering their widths will not change (that is, there will be no "jumps"). Recommended to add it in the `onReady` callback.

Once added, the widths will be recalculated on each window resize event, and removed only when destroying the FilterBox instance.

### countVisible()

Returns the number of currently unfiltered (visible) items.

### countTotal()

Returns the total number of items.

### getFilter()

Returns the main input's value.

### countHidden()

Returns the number of hidden items.

### getTarget()

Returns the main target DOM element.

### getInput()

Returns the main input DOM element.

### enableHighlight()

Enables or disables the highlight feature. Accepts `true` or `false`.

### filter(searchterm)

*Parameters: searchterm (string) or none*

Filters the main target, just like if you typed something into the main input.

### focus()

Moves focus to the main input, which triggers the focus event. 

FilterBox adds `data-filter` attributes to the DOM only when the main input is first focused, so this method can be used to force a full init.

### update()

Updates the main target and also the attached displays.

### clear()

Sets the main input empty and shows all items of the main target.

### destroy()

Removes the FilterBox instance in question and its event listeners.

### updateDisplays()

Updates attached displays' texts, if there's any. FilterBox does this automatically but sometimes you may need to use it.

### setZebra()

CSS `nth-child` does not work well with FilterBox as items are not removed from the DOM but only made hidden, so zebra striping will fail on filter. To overcome this, call setZebra() to re-add striping.

FilterBox will do this automatically internally, you will need to do it only if the main target is modified from outside, eg. when using another library to sort table columns.

### toggleHide(element, hide)

*Parameters: element (DOM element), hide (boolean)*

A helper method to hide or show DOM elements, eg. for hiding a no-result display. Uses the library's own CSS.

First parameter is the DOM element for which you would like to toggle visibility and the second is a boolean (`true` hides the element).


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


## Status attributes

The following attributes are toggled dynamically based on the current filtering state for easier CSS styling.

### data-has-filter

If the filterbox is not empty the input (or the wrapper, if available) will get a `data-has-filter` attribute with value "1".

Can be used eg. to highlight the main input to indicate that filtering is active. Unlike CSS ":focus" this will be kept even after leaving the input.

### data-no-match

If there's no match the input (or the wrapper, if available) will get a `data-no-match` attribute with value "1".

Can be used eg. to add a red background color or outline.

### data-invert-filter

If the filter mode is invert, the input (or the wrapper, if available) will get a `data-invert-filter` attribute with value "1".

### data-init

After initializing the input (or the wrapper, if available) will get `data-init="1"`. 


## Invert filter (invert search)

If the search term starts or ends with an exclamation mark ("!") character then invert filtering will be performed. This means that if you type `spaghetti!` to the input, the result set will contain items NOT having `spaghetti` in them.

With invert filtering you can easily see items not matching the current search term.


## Contributing

You can report a problem or submit a PR via GitHub.
