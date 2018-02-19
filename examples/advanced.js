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