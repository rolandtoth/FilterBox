/**
 * FilterBox v0.3.5
 */
(function (window, document) {

    'use strict';

    // CustomEvent polyfill
    (function () {
        if (typeof window.CustomEvent === "function") return false;

        function CustomEvent(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: undefined};
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }

        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();


    function hashCode(str) {
        var hash = 0, i = 0, len = str.length;
        while (i < len) hash = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
        return hash;
    }


    /**
     * Wrapper to allow return false if the filterbox couldn't be created.
     *
     * @param o
     * @returns {FilterBox || boolean}
     */
    window.addFilterBox = function (o) {
        try {
            return new FilterBox(o);
        }
        catch (err) {
            if (o && o.debuglevel) {
                console.log(o.debuglevel === 2 ? err : err.message);
            }
            return false;
        }
    };


    function FilterBox(o) {

        if (!o.target || !o.target.selector || !o.target.items || !document.querySelector(o.target.selector + ' ' + o.target.items)) {
            throw new Error('FilterBox: no items to filter');
        }


        if (o.callbacks && typeof o.callbacks.onInit === 'function' && o.callbacks.onInit() === false) {
            throw new Error('FilterBox: onInit callback');
        }


        function setCb(n) {
            return o.callbacks && typeof o.callbacks[n] === 'function' ? o.callbacks[n] : false;
        }


        var self = this,
            target = o.target.selector,
            $target = document.querySelector(target),
            items = o.target.items,
            $items,
            dataSources = o.target.sources || ['*'],
            $addTo = o.addTo && o.addTo.selector && document.querySelector(o.addTo.selector) ? document.querySelector(o.addTo.selector) : $target,
            position = o.addTo && o.addTo.position ? o.addTo.position : 'before',
            inputDelay = o.inputDelay >= 0 ? o.inputDelay : 300,
            input = o.input && o.input.selector && document.querySelector(o.input.selector) ? o.input.selector : false,
            inputAttrs = o.input && o.input.attrs ? o.input.attrs : false,
            $input,
            wrapper = o.wrapper || false,
            wrapperAttrs = o.wrapper && o.wrapper.attrs ? o.wrapper.attrs : false,
            $wrapper,
            label = o.input && o.input.label ? o.input.label : false,
            $label,
            displays = o.displays && typeof o.displays === 'object' ? o.displays : false,
            $displays = [],
            suffix = o.suffix ? o.suffix : '',
            zebra = o.zebra || false,
            lazy = o.lazy === false,
            zebraAttr = 'data-odd' + suffix,
            hideAttr = 'data-hide' + suffix,
            initAttr = 'data-init' + suffix,
            hasFilterAttr = 'data-has-filter' + suffix,
            noMatchAttr = 'data-no-match' + suffix,
            filterAttr = o.filterAttr || 'data-filter' + suffix,
            styleId = 'filterbox-css' + suffix,
            useDomFilter = o.useDomFilter || false,
            beforeFilter = setCb('beforeFilter'),
            afterFilter = setCb('afterFilter'),
            onEnter = setCb('onEnter'),
            onEscape = setCb('onEscape'),
            onReady = setCb('onReady'),
            beforeDestroy = setCb('beforeDestroy'),
            afterDestroy = setCb('afterDestroy'),
            enableObserver = o.enableObserver === true,
            hideSelector = '',
            hl = o.highlight || false,
            hlTag = hl && hl.tag ? hl.tag : 'fbxhl',
            hlClass = 'on' + suffix,
            hlStyle = hl && hl.style ? hlTag + '.' + hlClass + '{' + hl.style + '}' : '',
            hlMinChar = hl && hl.minChar ? hl.minChar : 2,
            hiddenStyle = '[' + hideAttr + '="1"]' + '{display:none}',
            init = false,
            initTableColumns = false,
            observer;


        function getItems() {
            return $target.querySelectorAll(items);
        }

        self.getTotal = function () {
            return getItems().length;
        };


        $items = getItems();
        self.hash = 'fbx' + hashCode(target + items + self.getTotal() + suffix);


        self.update = function () {
            handleFocus(true);
            updateDisplays(target);
            self.setZebra();
        };


        self.getTarget = function () {
            return $target;
        };


        self.getInput = function () {
            return $input;
        };


        function unwrap(wrapper) {
            var docFrag = document.createDocumentFragment();
            while (wrapper.firstChild) {
                var child = wrapper.removeChild(wrapper.firstChild);
                docFrag.appendChild(child);
            }
            wrapper.parentNode.replaceChild(docFrag, wrapper);
        }


        function removeEl($el) {
            $el && $el.parentNode && $el.parentNode.removeChild($el);
        }


        self.clear = function () {
            self.filter('');
        };


        self.destroy = function () {

            if (!init) return;
            if (beforeDestroy && beforeDestroy.call(self) === false) return;

            if (hl) dehighlight();


            for (var i = 0; i < $items.length; i++) {
                if (!useDomFilter) $items[i].removeAttribute(filterAttr);
                $items[i].removeAttribute(zebraAttr);
            }

            ($wrapper || $input).removeAttribute(hasFilterAttr);
            ($wrapper || $input).removeAttribute(noMatchAttr);

            if ($input.form) $input.form.removeEventListener('reset', self.clear);

            $input.removeEventListener('input', addHandleInput);
            $input.removeEventListener('focus', handleFocus);
            $input.removeEventListener('keydown', handleKeydown);

            document.removeEventListener('filterboxsearch', addFilterBoxSearch);

            window.removeEventListener('resize', _fixTableColumns);
            initTableColumns = false;

            if ($target.tagName === 'TABLE') {
                var $headers = $target.querySelectorAll('th');

                for (var i = 0; i < $headers.length; i++) {
                    $headers[i].removeAttribute('style');
                }
            }

            if (observer) observer.disconnect();

            for (var k = 0; k < $displays.length; k++) removeEl($displays[k].el);
            removeEl(document.getElementById(styleId));

            // only remove $input if it's added by FilterBox
            // wrapper is always removed
            if (wrapper) unwrap($wrapper);
            if (label) removeEl($label);

            // remove added attributes from $input only if added by the plugin
            if (input && typeof inputAttrs === 'object') {
                for (var key in inputAttrs) {
                    if (inputAttrs.hasOwnProperty(key) && $input.getAttribute(key) === inputAttrs[key]) {
                        $input.removeAttribute(key);
                    }
                    if ($input.id === self.hash) $input.removeAttribute('id');
                    $input.removeAttribute(initAttr);
                }
            }
            $input.value = '';
            if (!input) removeEl($input);

            $target.removeAttribute(hideAttr);

            afterDestroy && afterDestroy();

            init = false;
        };


        function isHidden(el) {
            return (el.offsetParent === null);
        }


        self.getHidden = function () {
            var hidden = 0,
                $allItem = getItems();

            for (var i = 0; i < $allItem.length; i++) {
                hidden += isHidden($allItem[i]) ? 1 : 0;
            }

            return hidden;
        };


        self.getVisible = function () {
            return self.getTotal() - self.getHidden();
        };


        self.enableHighlight = function (bool) {
            hl = bool === false;
        };


        self.setZebra = function () {

            if (!zebra) return false;

            var $items = self.getVisibleItems($input.value),
                z = 1;

            for (var i = 0; i < $items.length; i++) {
                var $item = $items[i];
                $item.setAttribute(zebraAttr, (z % 2));
                z++;
            }
        };


        self.filter = function (v) {
            $input.value = v;
            handleFocus();
            handleInput();
            return self;
        };


        self.focus = function (moveToEnd) {
            $input.focus();

            if (moveToEnd && $input.value && $input.setSelectionRange) {
                var len = $input.value.length * 2;
                $input.setSelectionRange(len, len);
            }

            return self;
        };


        function createNode(child) {
            var node = document.createElement(hlTag);
            node.classList.add(hlClass);
            node.appendChild(child);
            return node;
        }


        function dehighlight(container) {
            if (!hl) return;

            if (!container) container = $target;

            if (!container.childNodes) return;

            for (var i = 0; i < container.childNodes.length; i++) {
                var node = container.childNodes[i];

                if (node.className === hlClass) {
                    node.parentNode.parentNode.replaceChild(document.createTextNode(node.parentNode.textContent.replace(/<[^>]+>/g, '')), node.parentNode);
                    return;
                } else if (node.nodeType !== 3) {
                    dehighlight(node);
                }
            }
        }


        function highlight(term, $container, filter) {

            if (!hl) return;
            if (term.length < hlMinChar) return;

            var $allItem = filter ? $container.querySelectorAll(filter) : $container.childNodes;

            for (var i = 0; i < $allItem.length; i++) {
                var node = $allItem[i];

                if (node.nodeType === 3) {
                    var data = node.data,
                        data_low = data.toLowerCase();

                    if (data_low.indexOf(term) >= 0) {
                        var new_node = document.createElement(hlTag),
                            result;

                        while ((result = data_low.indexOf(term)) !== -1) {
                            new_node.appendChild(document.createTextNode(data.substr(0, result)));
                            new_node.appendChild(createNode(document.createTextNode(data.substr(result, term.length))));
                            data = data.substr(result + term.length);
                            data_low = data_low.substr(result + term.length);
                        }
                        new_node.appendChild(document.createTextNode(data));
                        node.parentNode.replaceChild(new_node, node);
                    }
                } else {
                    highlight(term, node);
                }
            }
        }


        function debounce(func, wait, immediate) {
            var timeout;
            return function () {
                var context, args, later;
                context = this;
                args = arguments;
                later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }


        function _insertBefore($el, $referenceNode) {
            $referenceNode.parentNode.insertBefore($el, $referenceNode);
        }


        function _insertAfter($el, $referenceNode) {
            $referenceNode.parentNode.insertBefore($el, $referenceNode.nextSibling);
        }


        function setStyles(css) {
            var s = document.getElementById(styleId);

            if (!s) {
                s = document.createElement('style');
                s.type = 'text/css';
                s.id = styleId;
                s.appendChild(document.createTextNode(hlStyle));
                document.querySelector('head').appendChild(s);
            }

            s.innerText = css + hlStyle + hiddenStyle;
        }


        function setAttrs(el, attrs) {
            if (el && attrs && typeof attrs === 'object') {
                for (var key in attrs) {
                    if (attrs.hasOwnProperty(key)) {
                        el.setAttribute(key, attrs[key]);
                    }
                }
            }
        }


        self.getFilter = function () {
            return $input.value;
        };


        self.updateDisplays = function (tgt) {
            if (tgt === target) {
                for (var i = 0; i < $displays.length; i++) {
                    $displays[i].el.innerHTML = $displays[i].text.call(self);
                }
            }
        };


        function wrap(el, wrapper) {
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
        }


        function addMarkup() {

            if (input && document.querySelector(input)) {
                $input = document.querySelector(input);
            } else {
                $input = document.createElement('input');
                $input.type = 'text';
                insertDom($input, $addTo, position);
            }

            setAttrs($input, inputAttrs);


            if (wrapper) {
                $wrapper = document.createElement(wrapper.tag || 'div');
                setAttrs($wrapper, wrapperAttrs);
                wrap($input, $wrapper);
            }

            if (label) {
                var id = $input.id || self.hash;

                $label = document.createElement('label');
                $label.setAttribute('for', id);
                $label.innerHTML = label;

                $input.id || $input.setAttribute('id', id);

                _insertBefore($label, $input);
            }

            $input.getFilterBox = function () {
                return self;
            };

            self.setZebra();
        }


        function insertDom($el, $to, where) {
            if (!$el || !$to) return false;
            switch (where) {
                case 'append':
                    $to.appendChild($el);
                    break;
                case 'prepend':
                    $to.parentElement.insertBefore($el, $to);
                    break;
                case 'after':
                    _insertAfter($el, $to);
                    break;
                default:
                    _insertBefore($el, $to);
            }
        }


        function addDisplays() {
            if (!displays) return false;

            for (var k in displays) {
                if (!displays.hasOwnProperty(k)) continue;

                var d = displays[k],
                    $addTo = d.addTo && d.addTo.selector ? document.querySelector(d.addTo.selector) : $target,
                    position = d.addTo && d.addTo.position || 'before',
                    tag = d.tag || 'div',
                    text = d.text && typeof d.text === 'function' ? d.text : false;

                if (text) {
                    var $display = document.createElement(tag);
                    setAttrs($display, d.attrs);
                    insertDom($display, $addTo, position);

                    $displays.push({
                        el: $display,
                        text: text
                    });

                }
            }

            self.updateDisplays(target);
        }


        function addFilterBoxSearch(e) {
            self.updateDisplays(e.detail.target);
            self.setZebra();
        }


        var addHandleInput = debounce(function () {
            handleInput();
        }, inputDelay);


        function addEvents() {

            $input.addEventListener('focus', handleFocus);
            $input.addEventListener('keydown', handleKeydown);
            $input.addEventListener('input', addHandleInput);

            if ($input.form) $input.form.addEventListener('reset', self.clear);

            document.addEventListener('filterboxsearch', addFilterBoxSearch);

            if (enableObserver && window.MutationObserver) {
                observer = new MutationObserver(function (mutationsList) {
                    for (var i = 0; i < mutationsList.length; i++) {
                        var t = mutationsList[i].type;
                        if (t === 'childList') {
                            self.updateDisplays(target);
                            self.setZebra();
                        } else if (t === 'characterData') {
                            handleFocus(true);
                            hl && highlight(self.getFilter(), $target, dataSources.join(','));
                            self.setZebra();
                            self.updateDisplays(target);
                        }
                    }
                });
                observer.observe($target, {childList: true, subtree: true, characterData: true});
            }
        }


        self.toggleHide = function ($el, hide) {
            if ($el) {
                if ($el.length) {
                    for (var i = 0; i < $el.length; i++) {
                        $el[i].setAttribute(hideAttr, hide ? '1' : '0')
                    }
                } else {
                    $el.setAttribute(hideAttr, hide ? '1' : '0')
                }
            }
        };


        self.isAllItemsHidden = function () {
            return self.count(self.getFilter()) === 0;
        };


        self.isAllItemsVisible = function () {
            return self.getHideSelector() === '';
        };


        function getTerms(v) {
            if (!v) return false;

            v = v.replace(/['"]+/g, '');
            v = v.trim().replace(/ +/g, ' ');  // remove double spaces

            return v ? v.toLowerCase().split(' ') : false;
        }


        function unique(a) {
            return a.filter(function (item, i, ar) {
                return ar.indexOf(item) === i;
            });
        }


        var _fixTableColumns = debounce(function () {
            var $headers = self.getTarget().querySelectorAll('th');

            for (var i = 0; i < $headers.length; i++) {
                $headers[i].style.width = $headers[i].offsetWidth + 'px';
            }
        }, 500);


        self.fixTableColumns = function ($table) {
            _fixTableColumns($table);
            if(!initTableColumns) {
                window.addEventListener('resize', _fixTableColumns);
                initTableColumns = true;
            }
        };


        self.clearFilterBox = function () {
            $input.value = '';
            setStyles('');
            hideSelector = '';
            hl && dehighlight(self.getTarget());
            self.updateDisplays(target);
            afterFilter && afterFilter.call(self);
        };


        function handleFocus(force) {

            if (useDomFilter || (!force && $input.getAttribute(initAttr))) {
                return false;
            }

            var $items = getItems();

            for (var i = 0; i < $items.length; i++) {
                var $item = $items[i],
                    data = getContent($item.querySelectorAll(dataSources.join(',')));

                if (data) {
                    data = unique(data.split(' ')); // remove duplicates
                    $item.setAttribute(filterAttr, data.join(' ').trim());
                }
            }

            $input.setAttribute(initAttr, '1');
        }


        self.visitFirstLink = function (e, forceNewTab) {

            var $firstItem = self.getFirstVisibleItem(),
                $link;

            if (self.getFilter() === '') {
                window.localStorage && localStorage.removeItem(self.hash);
                // return false;
            }

            if ($firstItem.tagName === 'A' || $firstItem.querySelector('a')) {
                e.preventDefault();

                if ($firstItem.tagName === 'A') {
                    $link = $firstItem;
                } else if ($firstItem.querySelector('a')) {
                    $link = $firstItem.querySelector('a');
                }

                if ($link) {
                    if (forceNewTab && $link.getAttribute('target') !== '_blank') {
                        $link.setAttribute('target', '_blank');
                        $link.click();
                        $link.removeAttribute('target');
                    } else {
                        $link.click();
                    }

                    if (window.localStorage) {
                        localStorage.setItem(self.hash, self.getFilter());
                    }
                }
            } else {
                window.localStorage && localStorage.removeItem(self.hash);
            }
        };


        function handleKeydown(e) {
            e = e || window.event;

            if (!e) return false;

            if (e.keyCode === 27) {
                if (onEscape) {
                    onEscape.call(self, e);
                } else {
                    e.preventDefault();
                    if (self.getFilter() !== '') {
                        self.clearFilterBox();
                    } else {
                        $input.blur();
                    }
                }
            }

            if (e.keyCode === 13) {
                onEnter && onEnter.call(self, e);
            }
        }


        function handleInput() {

            var v = $input.value.toLowerCase().trim();

            if (beforeFilter && beforeFilter.call(self) === false) return;

            ($wrapper || $input).removeAttribute(noMatchAttr);

            if ($input.value) {
                ($wrapper || $input).setAttribute(hasFilterAttr, '1');
            } else {
                ($wrapper || $input).removeAttribute(hasFilterAttr);
            }


            if (v === '') {

                self.clearFilterBox();

            } else {

                // do the filter
                var terms = getTerms(v),
                    $dataSources = dataSources.join(','),
                    $visibleItems;

                if (!terms) {
                    self.clearFilterBox();
                    return false;
                }

                hideSelector = self.getHideSelector(terms);
                setStyles(hideSelector + '{display:none}');

                $visibleItems = self.getVisibleItems(v);

                if (!$visibleItems.length) {
                    ($wrapper || $input).setAttribute(noMatchAttr, '1');
                } else {
                    ($wrapper || $input).removeAttribute(noMatchAttr);
                }

                if (hl) {
                    setTimeout(function () {
                        for (var i = 0; i < $visibleItems.length; i++) {

                            hl && dehighlight($visibleItems[i]);

                            for (var j = 0; j < terms.length; j++) {
                                highlight(terms[j], $visibleItems[i], $dataSources);
                            }
                        }
                    }, 100);
                }

                self.updateDisplays(target);
                self.setZebra();
                afterFilter && afterFilter.call(self);
            }

            document.dispatchEvent(new CustomEvent('filterboxsearch', {detail: self}));
        }


        self.getHideSelector = function (terms, invert) {

            terms = terms || $input.value;

            var selector = [];

            for (var j = 0; j < terms.length; j++) {

                var itemsPart = '[' + filterAttr + '*="' + terms[j] + '"]';

                if (!invert) {
                    itemsPart = ':not(' + itemsPart + ')';
                }

                selector.push(target + ' ' + items + itemsPart);
            }

            return selector.join(',');
        };


        self.count = function (v) {

            var terms = getTerms(v);

            if (!v || !terms) return self.getTotal();

            var selector = self.getHideSelector(terms);

            return self.getTotal() - document.querySelectorAll(selector).length;
        };


        self.getFirstVisibleItem = function () {
            var $items = getItems();

            for (var i = 0; i < $items.length; i++) {
                if (!isHidden($items[i])) {
                    return $items[i];
                }
            }
        };


        self.getVisibleItems = function (v) {
            return v ? document.querySelectorAll(self.getHideSelector(getTerms(v), true)) : getItems();
        };


        /**
         * Get textContent of one or more elements (recursive)
         *
         * @param $el
         * @return string
         */
        function getContent($el) {

            var content = '';

            if ($el) {
                if ($el.length) {
                    for (var i = 0; i < $el.length; i++) {
                        content += getContent($el[i]);
                    }
                } else if ($el.textContent) {
                    content = $el.textContent.replace(/<[^>]*>/g, '');
                    content = removeNewLines(content).toLowerCase();
                }
            }

            return content + ' ';
        }

        //remove line breaks from str
        function removeNewLines(str) {
            str = str.replace(/\s{2,}/g, ' ');
            str = str.replace(/\t/g, ' ');
            str = str.toString().trim().replace(/(\r\n|\n|\r)/g, "");
            return str;
        }


        self.restoreFilter = function () {
            if (!window.localStorage) {
                return false;
            }
            if (localStorage.getItem(self.hash)) {
                self.filter(localStorage.getItem(self.hash));
                localStorage.removeItem(self.hash);
            }
        };

        setStyles();
        addMarkup();
        addDisplays();
        addEvents();

        if (lazy) {
            handleFocus();
        }

        init = true;

        onReady && onReady.call(self);

        return self;
    }
})(window, document);
