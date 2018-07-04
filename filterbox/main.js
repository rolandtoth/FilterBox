var scriptsDir = '/js/';

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

// polyfill assign
if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
        'use strict';
        if (target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}

function setActiveMenuItem() {
    var url = window.location.href,
        mainMenuItems = document.querySelectorAll('#menuheader li > a');

    if (mainMenuItems.length) {
        for (var i = 0, len = mainMenuItems.length; i < len; i++) {
            var menuItem = mainMenuItems[i];
            if (menuItem.getAttribute('href') && menuItem.getAttribute('href') !== '/' && url.indexOf(menuItem.getAttribute('href')) !== -1) {
                menuItem.parentElement.classList.add('active');
            }
        }
    }
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
    };
}

//
//
// function throttle(fn, wait) {
//     var time = Date.now();
//     return function () {
//         if ((time + wait - Date.now()) < 0) {
//             fn();
//             time = Date.now();
//         }
//     }
// }

// https://gist.github.com/a-c-t-i-n-i-u-m/ce1d8f93fb6ebd8ccbbf
var filterEventHandler = function (selector, callback) {
    return (!callback || !callback.call) ? null : function (e) {
        var target = e.target || e.srcElement || null;
        while (target && target.parentElement && target.parentElement.querySelectorAll) {
            var elms = target.parentElement.querySelectorAll(selector);
            for (var i = 0; i < elms.length; i++) {
                if (elms[i] === target) {
                    e.filterdTarget = elms[i];
                    callback.call(elms[i], e);
                    return;
                }
            }
            target = target.parentElement;
        }
    };
};


// main calendar mouse events (refactored from inline events)
function setupCalendarEvents() {

    var $maintable = document.getElementById('maintable'),
        mouseDown = 0;

    // dragitem
    $maintable.addEventListener('mousedown', filterEventHandler('[data-dragitem]', function (event) {
        top.dragitem(event, event.filterdTarget.getAttribute('data-dragitem'), this);
    }));

    // double-click: edit item
    $maintable.addEventListener('dblclick', filterEventHandler('[data-dblclick-edititem]', function (event) {
        edititem(event, event.filterdTarget.getAttribute('data-dblclick-edititem'));
    }));

    // double-click: add item
    $maintable.addEventListener('dblclick', filterEventHandler('[data-dblclick-additem]', function (event) {
        var args = JSON.parse(this.getAttribute('data-dblclick-additem'));
        additem(event, args[0], args[1]);
    }));

    // click: edit day
    $maintable.addEventListener('click', filterEventHandler('[data-click-editday]', function (event) {
        var args = JSON.parse(event.filterdTarget.getAttribute('data-click-editday'));
        editday(event, args[0], args[1], args[2], this);
    }));

    // click: open user data iframe
    $maintable.addEventListener('click', filterEventHandler('[data-click-wowmulti]', function (event) {

        var userName = event.filterdTarget.getAttribute('data-click-wowmulti');

        if (!userName) {
            return false;
        }

        if (top.wowmulti && top.wowmulti(event, userName)) {
            return false;
        }

        openwin('/user/info/' + userName);

    }));

    // mouseover: show tooltip
    $maintable.addEventListener('mouseover', debounce(filterEventHandler('[data-mouseover-tooltip]', function (event) {
            if (mouseDown !== 1) {  // do not load tooltip when dragging an event
                var node = event.filterdTarget,
                    args = JSON.parse(node.getAttribute('data-mouseover-tooltip'));

                starttitle(node, args[0], args[1]);
            }
        }), 330)
    );

    // mouseout stoptitle
    $maintable.addEventListener('mouseout', debounce(filterEventHandler('[data-mouseover-tooltip]', function () {
            stoptitle();
        }), 50)
    );

    $maintable.addEventListener('mouseout', debounce(filterEventHandler('tr', function () {
            stoptitle();
        }), 50)
    );

    // mouseout stoptitle fix (sometimes the mouseout can't fire)
    document.body.onmousedown = function () {
        if (window.stoptitle) {
            stoptitle();
        }
        mouseDown = 1;
    };

    document.body.onmouseup = function () {
        mouseDown = 0;
    };

    // mouseup dropitem (on img)
    $maintable.addEventListener('mouseup', filterEventHandler('[data-mouseup-dropitem]', function (event) {

        if (dragfrom === null) {
            return false;
        }

        var dropTarget = dragfrom.querySelector('img'),
            droppedItem = event.filterdTarget,
            args;

        // check if dragged item is dropped to the same cell (and do nothing)
        if (dropTarget && dropTarget === droppedItem) {
            // console.log('same!');
            return false;
        }

        args = JSON.parse(droppedItem.getAttribute('data-mouseup-dropitem'));
        top.dropitem(event, "dayto=" + args[0] + "&person=" + args[1]);
    }));
}

window.addEventListener('load', function () {

    var passwordChangeForm = document.querySelector('form[name="setpasswd"]');

    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', function () {
            var btn = passwordChangeForm.querySelector('.button');
            btn.setAttribute('style', 'opacity: 0.5; pointer-events: none !important;');
            // btn.setAttribute('disabled', 'disabled');

            return true;
        })
    }

    // loadAsset('https://cdn.jsdelivr.net/npm/lozad/dist/lozad.min.js', function () {
    //     var observer = lozad('#maintable table', {
    //         load: function (el) {
    //             el.classList.remove('lazy');
    //         }
    //     });
    //     observer.observe();
    // });
});

var pickers = [];

/**
 * Show confirm on click with message set in data-confirm-message attribute.
 *
 * @return bool
 */
function initConfirmMessages() {

    var selector = '[data-confirm-message]';

    document.body.addEventListener('click', filterEventHandler(selector, function (e) {

        var $el = e.filterdTarget,
            msg = $el.getAttribute('data-confirm-message');

        // continue if there is no message set
        if (!msg || msg === '') {
            return true;
        }

        msg = msg.replaceAll('NEWLINE', "\n");

        if (!confirm(msg)) {
            e.preventDefault();
            return false;
        }
    }));
}

document.addEventListener('DOMContentLoaded', function () {

    initConfirmMessages();

    var $maintable = document.getElementById('maintable');

    // select text on click in timetable date/time
    // document.querySelector('.checkinout-table').addEventListener('click', filterEventHandler('[type="number"]', function (event) {
    //     setTimeout(function() {
    //         event.filterdTarget.select();
    //     }, 0);
    // }));


    if ($maintable) {
        setupCalendarEvents();
    }

    var $userThumb = document.querySelector('.image-row-admin-user img'),
        $uploadField = document.querySelector('input[name="ldapdata_ldapimage"]');

    if ($userThumb && $uploadField) {
        $userThumb.style.cursor = 'pointer';
        $userThumb.addEventListener('click', function () {
            $uploadField.click();
        });
    }


    var $groupHolidayBtn = document.getElementById('group-holiday');

    if ($groupHolidayBtn) {
        $groupHolidayBtn.addEventListener('click', function (e) {
            e.preventDefault();
            parent.document.querySelector('#divwin iframe').src = '/admin/holidays/?show=' + this.getAttribute('data-person-id') + '&back=1#iframe';
            return false;
        });
    }


    var $toggleCheckboxesControls = document.querySelectorAll('[data-toggle-checkboxes]');

    if ($toggleCheckboxesControls.length) {
        for (var ii = 0; ii < $toggleCheckboxesControls.length; ii++) {

            $toggleCheckboxesControls[ii].classList.add('show-checked-only');

            var $toggleCheckboxes = document.createElement('button');

            $toggleCheckboxes.classList.add('toggle-checkbox-button');
            $toggleCheckboxes.classList.add('button');
//            $toggleCheckboxes.innerHTML = "✔";
//             $toggleCheckboxes.innerHTML = "☑";
            $toggleCheckboxes.innerHTML = "Change...";
            // $toggleCheckboxes.title = "Show/hide checked items only";
//            $toggleCheckboxesControls[ii].querySelector('td').appendChild(document.createElement('br'));
            $toggleCheckboxesControls[ii].querySelector('h4').appendChild($toggleCheckboxes);

            $toggleCheckboxesControls[ii].querySelector('button').addEventListener('click', function (e) {
                e.preventDefault();
                this.parentNode.parentNode.classList.toggle('show-checked-only');
                this.classList.toggle('on');
                return false;
            });
        }
    }


    loadAsset(scriptsDir + 'dragscroll.min.js?selector=".dragscroll"');


    // pikaday date picker

    loadAsset(scriptsDir + 'pikaday/moment.min.js?selector=".datepicker"', function () {
        var selector = this.selector;

        loadAsset(scriptsDir + 'pikaday/css/pikaday.css', function () {
            loadAsset(scriptsDir + 'pikaday/pikaday.js?async=true', function () {

                var $datepickers = document.querySelectorAll(selector);

                for (var ii = 0; ii < $datepickers.length; ii++) {

                    var minDate = $datepickers[ii].getAttribute('data-mindate'),
                        maxDate = $datepickers[ii].getAttribute('data-maxdate'),
                        language = $datepickers[ii].getAttribute('data-lang'),
                        datepickerSettings;

                    // console.log(new Date(today.getFullYear() + 3, 11, 31));

                    datepickerSettings = {
                        field: $datepickers[ii],
                        format: 'YYYY-MM-DD',
                        firstDay: 1,
                        // todayButton: true,   // not supported yet
                        // keyboardInput: false,
                        showWeekNumber: true,
                        // minDate: new Date(today.getFullYear(), 0, 31),  // first day of current year
                        // maxDate: new Date(today.getFullYear() + 3, 11, 31)  // end of current year
                        minDate: minDate ? new Date(Date.parse(minDate)) : false,  // first day of current year
                        maxDate: maxDate ? new Date(Date.parse(maxDate)) : false,  // end of current year
                        // defaultDate: moment().toDate(),
                        // setDefaultDate: true,
                        // maxDate: new Date(),
                        // disableWeekends: true
                    };


                    if (language === 'hu') {
                        datepickerSettings.i18n = {
                            previousMonth: 'előző hónap',
                            nextMonth: 'következő hónap',
                            months: ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'],
                            weekdays: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'],
                            weekdaysShort: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']
                        };
                    }

                    pickers[ii] = new Pikaday(datepickerSettings);

                    $datepickers[ii].addEventListener('change', function () {

                        var d = this.value;
                        // var d = moment.utc(this.value);
                        // console.log('requestedFrom: ' + d.format('YYYY-MM-DD'));

                        // console.log(d);
                        setTimeout(function () {
                            if (window.dosubmit) {
                                dosubmit(d);
                            }
                        }, 500);
                    });
                }
            });
        });
    });


    if (location.hash.indexOf('iframe') !== -1) {
        document.querySelector('html').classList.add('iframe');
    }

    var $selectorvaluesContainer = document.querySelector('.selectorvalues');

    if ($selectorvaluesContainer) {

        var checkedFlag = false;

        var $uncheckAll = document.createElement('button');
//        $uncheckAll.type = "checkbox";
        $uncheckAll.checked = true;
        $uncheckAll.name = "uncheck_all";
        $uncheckAll.innerHTML = "Toggle checkboxes";
//        $uncheckAll.innerHTML = "Uncheck all";
        $uncheckAll.id = "uncheck_all";

//        var $uncheckAllLabel = document.createElement('label');
//        $uncheckAllLabel.htmlFor = "uncheck_all";
//        $uncheckAllLabel.appendChild(document.createTextNode('Check/uncheck all'));

//        $uncheckAllLabel.appendChild($uncheckAll);
        $selectorvaluesContainer.appendChild($uncheckAll);

        // add click event
        $uncheckAll.addEventListener('click', function (e) {

            e.preventDefault();

            var $checkboxes = $selectorvaluesContainer.querySelectorAll('input[type="checkbox"]');

//            if($selectorvaluesContainer.querySelectorAll('[checked="checked"]').length === 0) {
//                checkedFlag = false;
//            }


            for (var ii = 0; ii < $checkboxes.length; ii++) {
                $checkboxes[ii].checked = checkedFlag;
//                $uncheckAll.innerHTML = 'Check all';
            }

            checkedFlag = !checkedFlag;
        });
    }

    // choices
    window.choices = [];

    loadAsset(scriptsDir + 'choices/choices.min.js?v=123&async=true&selector="select[name=group_parentid], select[name=person_group_id], select[name=ldapdata_manager], select[name=cal_grp], select[name=cal_report], body[class*="page-lll-detail-"] select[name*=lll_person], select[name=item_type_id], select.js[multiple]"', function () {

        var selectorArray = this.selector.split(',');

        for (var i = 0; i < selectorArray.length; i++) {

            var selector = selectorArray[i].trim(),
                $items = document.querySelectorAll(selector);

            for (var j = 0; j < $items.length; j++) {
                var $item = $items[j],
                    placeholderValue = ($item && $item.getAttribute('data-placeholder')) ? $item.getAttribute('data-placeholder') : 'search...';

                if (document.querySelector(selector)) {
                    window.choices.push(new Choices($item, {
                        shouldSort: false,
                        // shouldSortItems: false,
                        placeholder: true,
                        removeItemButton: true,
                        position: 'bottom',
                        itemSelectText: '',
                        placeholderValue: placeholderValue
                    }));
                }
            }
        }

        if (window.choices.length) {
            for (var i = 0; i < window.choices.length; i++) {
                var $choice = window.choices[i];

                $choice.passedElement.addEventListener('showDropdown', function () {
                    var $select = this,
                        id = $select.value;

                    var $option = $select.parentElement.parentElement.querySelector('.choices__list--dropdown [data-value="' + id + '"]');

                    if ($option) {
                        $option.classList.add('is-active');
                        $option.parentElement.scrollTop = $option.offsetTop - $option.parentElement.offsetTop;
                    }
                }, false);
            }
        }
    });


    loadAsset(scriptsDir + 'autosize.min.js?selector="table.questions textarea, textarea[name="lll_descr"]"&async=false', function () {
        autosize(document.querySelectorAll(this.selector));
    });

    // single user view
    //  checkbox before the user name to show that user only
    if ($maintable) {

        var $singleUserViewToggle = document.createElement('input'),
            $singleUserViewStyle = document.createElement('style'),
            singleUserCssRuleTemplate = '#maintable tr:nth-child(2) ~ tr:not([data-user-id="%s"]) { display: none; }';

        $singleUserViewToggle.type = 'checkbox';
        $singleUserViewToggle.title = 'Show/hide other users';
        $singleUserViewToggle.className = 'single-user-view-toggle';

        document.head.appendChild($singleUserViewStyle);

        $maintable.addEventListener('mouseover', debounce(filterEventHandler('td.person', function (event) {
            var $userCell = event.filterdTarget;

            // $userCell.insertBefore($singleUserViewToggle, $userCell.children[0]);
            $userCell.appendChild($singleUserViewToggle);
        }), 200));

        $singleUserViewToggle.addEventListener('click', function () {
            var $toggle = this;

            setTimeout(function () {
                if ($toggle.checked) {
                    var userId = $toggle.parentElement.parentElement.getAttribute('data-user-id');

                    $singleUserViewStyle.innerHTML = singleUserCssRuleTemplate.replace('%s', userId);
                    $maintable.classList.add('single-user-view');
                } else {
                    $singleUserViewStyle.innerHTML = '';
                    $maintable.classList.remove('single-user-view');
                }
            }, 20);
        });
    }


    // loadAsset(scriptsDir + 'a-color-picker/acolorpicker.js?selector=".colorpicker"&async=false', function () {
    //
    //     var $wrapper = document.querySelector(this.selector),
    //         $target = $wrapper.querySelector('input'),
    //         currentColor = $target.value ? '#' + $target.value : '',
    //         $preview = $wrapper.querySelector('.rowHighlight-preview'),
    //         hexAlpha = '58';
    //
    //     $target.setAttribute('maxlength', '6');
    //
    //     function colorizePreview(color) {
    //         return $preview.style.backgroundColor = '#' + color + hexAlpha;
    //     }
    //
    //     function removeActive() {
    //         var $active = $wrapper.querySelector('.a-color-picker-palette .active');
    //
    //         if ($active) {
    //             $active.classList.remove('active');
    //         }
    //     }
    //
    //     function setActive(color) {
    //         var $active = $wrapper.querySelector('.a-color-picker-palette [data-color="#' + color + '"]');
    //
    //         if ($active) {
    //             $active.classList.add('active');
    //         }
    //     }
    //
    //     var colorPicker = AColorPicker.createPicker({
    //         attachTo: this.selector,
    //         color: currentColor,
    //         showHSL: false,
    //         showRGB: false,
    //         showHEX: false,
    //         // palette: AColorPicker.PALETTE_MATERIAL_CHROME
    //         palette: AColorPicker.PALETTE_MATERIAL_500
    //     });
    //
    //     colorPicker.onchange = function (picker) {
    //         var selectedColor = picker.color.replace('#', '');
    //
    //         $target.value = selectedColor;
    //         removeActive();
    //         colorizePreview(selectedColor);
    //         setActive(selectedColor);
    //     };
    //
    //     if (currentColor) {
    //         var color = currentColor.replace('#', '');
    //         colorizePreview(color);
    //         setActive(color);
    //     }
    //
    //     $target.addEventListener('input', function () {
    //
    //         var value = this.value.replace('#', '');
    //
    //         if (value === '') {
    //             removeActive();
    //             $preview.removeAttribute('style');
    //             return false;
    //         }
    //
    //         if(value.length === 6) {
    //             $preview.style.backgroundColor = '#' + value + hexAlpha;
    //         }
    //     });
    //
    //     // $target.addEventListener('click', function() {
    //     //     $wrapper.querySelector(pickerSelector).style.display = 'block';
    //     // });
    //
    //     // $target.addEventListener('mouseout', function() {
    //     //     $wrapper.querySelector(pickerSelector).style.display = 'none';
    //     // });
    // });

    //https://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
    // function PopupCenter(url, title, w, h) {
    //     // Fixes dual-screen position                         Most browsers      Firefox
    //     var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    //     var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
    //
    //     var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    //     var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
    //
    //     var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    //     var top = ((height / 2) - (h / 2)) + dualScreenTop;
    //     var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    //
    //     // Puts focus on the newWindow
    //     if (window.focus) {
    //         newWindow.focus();
    //     }
    // }


    function refreshImagesAjax(url) {

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.onload = function () {
//            if (xhr.status === 200 && xhr.responseText !== token) {
            if (xhr.status === 200) {
//                console.log(xhr.responseText);
                if (xhr.responseText === '"OK"') {
                } else {
                    alert('Error, please try again!');
                }

                var $btn = document.querySelector('.refreshimages[data-url]');
                if ($btn) {
                    $btn.innerHTML = $btn.innerHTML.replace('...', '');
                    $btn.classList.remove('working');
                }
                alert('Images were successfully refreshed in Who is Who.');

            } else if (xhr.status !== 200) {
//                console.log('Request failed.  Returned status of ' + xhr.status);
                alert('Error, please try again!');
            }
        };
//        xhr.send(encodeURI('token=' + token + uid));
        xhr.send();
    }

    function refreshQrCodesAjax(url) {

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.onload = function () {
            if (xhr.status === 200) {
                if (xhr.responseText === '"OK"') {
                    alert('QR codes were successfully refreshed in Who is Who.');
                } else {
                    alert('Error, please try again!');
                }
            } else if (xhr.status !== 200) {
                alert('Error, please try again!');
            }

            var $btn = document.querySelector('.refreshqrcodes[data-url]');
            if ($btn) {
                $btn.innerHTML = $btn.innerHTML.replace('...', '');
                $btn.classList.remove('working');
            }
        };
        xhr.send();
    }

    // refresh image, images buttons
    var $refreshImagesButtons = document.querySelector('.refreshimages[data-url]');

    if ($refreshImagesButtons) {
        $refreshImagesButtons.addEventListener('click', function (e) {
            e.preventDefault();

            var url = this.getAttribute('data-url');

            this.innerHTML += '...';
            this.classList.add('working');

            refreshImagesAjax(url);

            return false;
        });
    }

    // refresh QR codes button
    var $refreshQrCodesButton = document.querySelector('.refreshqrcodes[data-url]');

    if ($refreshQrCodesButton) {
        $refreshQrCodesButton.addEventListener('click', function (e) {
            e.preventDefault();

            var url = this.getAttribute('data-url');

            this.innerHTML += '...';
            this.classList.add('working');

            refreshQrCodesAjax(url);

            return false;
        });
    }


    loadAsset(scriptsDir + 'filterbox/filterbox.js?async=false&selector="input[name=srch], .reporttable.active-employees"', function () {

        window.sidebarFilterBox = addFilterBox({
            target: {
                selector: '.sidebar table',
                items: 'tbody tr:not(:first-child)'
            },
            input: {
                selector: 'input[name="srch"]',
                // label: 'Search: ',
                attrs: {
                    placeholder: 'Filter...',
                    autocomplete: 'off'
                }
            },
            wrapper: {
                attrs: {
                    class: 'filterbox-wrap'
                }
            },
            displays: {
                counter: {
                    addTo: {
                        selector: 'input[name="srch"',
                        position: 'after'
                    },
                    tag: 'span',
                    attrs: {
                        class: 'filterbox-counter'
                    },
                    text: function () {
                        var txt,
                            visible = this.countVisible(),
                            total = this.countTotal();

                        if (visible === total) {
                            txt = total;
                        } else if (visible === 0) {
                            txt = ':-(';
                        } else {
                            txt = visible + '/' + total;
                        }

                        return txt;
                    }
                },
                showAll: {
                    addTo: {
                        selector: '.filterbox-wrap',
                        position: 'append'
                    },
                    tag: 'div',
                    attrs: {
                        class: 'filterbox-show-all'
                    },
                    text: function () {
                        return this.isAllItemsHidden() ? '<input type="reset" value="Clear filter">' : '';
                    }
                }
            },
            extraFilterAttrs: [
                'data-filter-email' // attribute on the item
                // 'td[data-filter-group]' // selector to match elements inside item
                // '[data-filter-email]'
            ],
            // lazy: false,
            inputDelay: 100,
            highlight: {
                style: 'background:#ff9;color: black;',
                minChar: 2
            },
            // debug: true,
            callbacks: {
                onReady: function () {
                    var $input = this.getInput();
                    this.focus();
                    this.restoreFilter();
                    $input.select();
                },
                onEnter: function (e) {
                    this.visitFirstLink(e);
                },
                // onEscape: function (e) {
                //     this.getInput().style.opacity = '0.25';
                //     var obj = this;
                //     setTimeout(function () {
                //         obj.emptyFilterBox(e);
                //         obj.getInput().style.opacity = '1';
                //     }, 2000);
                // },
                afterFilter: function () {
                    this.toggleHide(this.getTarget(), !this.countVisible());
                }
            }
        });


        window.employeesFilterBox = addFilterBox({
            target: {
                selector: '.reporttable.active-employees',
                items: 'tbody tr'
            },
            input: {
                attrs: {
                    placeholder: 'Filter...',
                    autocomplete: 'off'
                }
            },
            wrapper: {
                attrs: {
                    class: 'filterbox-wrap active-employees'
                }
            },
            displays: {
                counter: {
                    addTo: {
                        selector: '.filterbox-wrap',
                        position: 'append'
                    },
                    tag: 'span',
                    attrs: {
                        class: 'employee-counter'
                    },
                    text: function () {
                        var txt,
                            visible = this.getVisible(),
                            total = this.getTotal();

                        if (visible === total) {
                            txt = total;
                        } else if (visible === 0) {
                            txt = 0;
                        } else {
                            txt = visible + '/' + total;
                        }

                        return txt;
                    }
                }
            },
            highlight: {
                style: 'background:#ff9'
            },
            debuglevel: false,
            callbacks: {
                onEnter: function (e) {
                    this.visitFirstLink(e);
                },
                afterFilter: function () {
                    this.toggleHide(this.getTarget(), !this.countVisible());
                }
            }
        });
    });

    document.body.addEventListener('mouseover', filterEventHandler('input[type="number"]', function (event) {
        event.filterdTarget.focus();
        event.filterdTarget.select();
    }));

});


function loadAsset(path, callback, o) {

    var selector = getUrlParameter('selector', path).replace(/['"]+/g, '').trim(),
        async = getUrlParameter('async', path) === 'true',
        version = getUrlParameter('v', path),
        assetType = 'js',
        assetTag = 'script',
        assetSrc = 'src',
        needAsset = true;

    if (selector.length > 0 && !document.querySelector(selector))
        return false;

    if (version.length) {
        version = '?v=' + version;
    }

    function getUrlParameter(name, url) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        url = url ? url : window.location.search;

        // var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        var regex = new RegExp('[\\?&]' + name + '=([^&]*)'),
            results = regex.exec(url);

        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    path = path.split(/\?(.+)/)[0]; // remove url parameters (settings)

    if (path.slice(-3) === 'css') {
        assetType = 'css';
        assetTag = 'link';
        assetSrc = 'href';
    }

    if (document.querySelector(assetTag + '[' + assetSrc + '="' + path + '"]')) needAsset = false;

    function callCallback() {
        if (callback) {
            var obj = {};
            if (selector) obj.selector = selector;
            if (o) obj.o = o;
            callback.call(obj);
        }
    }

    if (needAsset) {

        var asset = document.createElement(assetTag);
        asset[assetSrc] = path + version;

        if (assetType === 'js') {
            asset.type = "text/javascript";
            asset.async = async;

            if (asset.readyState) { // IE
                asset.onreadystatechange = function () {
                    if (asset.readyState === "loaded" || asset.readyState === "complete") {
                        asset.onreadystatechange = null;
                        callCallback();
                    }
                };
            } else {    // others
                asset.onload = callCallback;
            }

        } else {    // CSS
            asset.rel = "stylesheet";
            callCallback();
        }
        document.getElementsByTagName("head")[0].appendChild(asset);

    } else {    // always run callback
        callCallback();
    }
}
