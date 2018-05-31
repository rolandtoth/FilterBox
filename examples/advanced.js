var myFilterBox = addFilterBox({
    target: {
        selector: '.world-countries',
        items: 'tbody tr',
        sources: [
            'td:nth-child(1)',
            'td:nth-child(3)'
        ]
    },
    addTo: {
        selector: '.world-countries',
        position: 'before'
    },
    input: {
        label: 'Search: ',
        attrs: {
            placeholder: 'Enter country or capital...'
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
            attrs: {
                class: 'no-results'
            },
            text: function () {
                return !this.getVisible() ? ('No matching country or capital for "' + this.getFilter() + '"' : '') + '.';
            }
        }
    },
    callbacks: {
        onReady: onFilterBoxReady,
        afterFilter: function () {
            this.toggleHide(this.getTarget(), this.isAllItemsHidden());
        },
        onEnter: function () {
            var $firstItem = this.getFirstVisibleItem();

            if ($firstItem) {
                alert('First visible item: ' + $firstItem.querySelector('td').textContent + '\n(onEnter callback)');
            }
        }
    },
    highlight: {
        style: 'background: #ff9',
        minChar: 3
    },
    filterAttr: 'data-filter',
    suffix: '-mysuffix',
    debuglevel: 2,
    inputDelay: 100,
    zebra: true,
    enableObserver: true,
    initTableColumns: true,
    useDomFilter: false
});


function onFilterBoxReady() {
    this.fixTableColumns(this.getTarget());
    this.filter('bra');
    this.focus(true);
}
