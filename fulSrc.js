! function(document, window) {
    // ---------
    // util

    var $ = function(q) {
        ret = document.querySelectorAll.call(document, q);
        return ret.length == 1 ? ret[0] : ret
    }
    var debug_mode = true;

    var f_abs = function(n) {
        return (n ^ (n >> 31)) - (n >> 31)
    };
    var f_floor = function(n) {
        return ~~n
    };

    function hasClass(ele, cls) {
        if (cls.replace(/\s/g, '').length == 0) return false;
        return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
    }

    function addClass(ele, cls) {
        if (!hasClass(ele, cls)) {
            ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
        }
    }

    function removeClass(ele, cls) {
        if (hasClass(ele, cls)) {
            var newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
            while (newClass.indexOf(' ' + cls + ' ') >= 0) {
                newClass = newClass.replace(' ' + cls + ' ', ' ');
            }
            ele.className = newClass.replace(/^\s+|\s+$/g, '');
        }
    }

    var addEvent = function(elm, evType, fn, useCapture) {
        if (elm.addEventListener) {
            addEvent = function(elm, evType, fn, useCapture) {
                elm.addEventListener(evType, fn, useCapture || false)
            }
        } else if (elm.attachEvent) {
            addEvent = function(elm, evType, fn, useCapture) {
                elm.attachEvent('on' + evType, fn)
            }
        } else {
            addEvent = function(elm, evType, fn, useCapture) {
                elm['on' + evType] = fn
            }
        }
        addEvent(elm, evType, fn, useCapture)
    }

    // ----------
    // fulsrc cls
    function fScreen(conf) {
        this.init(conf);
        this.option(conf);
        this.hook();
        this.nav_bind();
        this.active(conf.default || 0);
    }
    fScreen.prototype.option = function(conf) {
        this.timeout = conf.timeout || 0.6;
        this.target.style.transition = "all " + this.timeout + "s";
        this.loop = conf.loop || false;
        this.touch_threshold = conf.touch_threshold || 0.2;

        this.nav = conf.nav || undefined;
        if (!this.nav) return;
        if (typeof this.nav == "string") this.nav = $(this.nav);
        this.nav_els = this.nav.children;
    }
    fScreen.prototype.reSize = function() {
        // console.dir(this.target)
        this.wapperH = this.target.clientHeight;
        for (var i = 0; i < this.panel_els.length; i++) {
            this.panel_els[i].style.height = this.wapperH + "px";
        }

        this.active(this.cur_index);
    }
    fScreen.prototype.init = function(conf) {
        this.name = conf.name || "NONAME";
        this.target = conf.el || $("body");
        if (typeof this.target == "string") this.target = $(this.target);

        // timeout
        this.timeS1 = new Date().getTime();
        this.timeS2 = 0;

        // css style
        this.target.style.position = "absolute";
        // this.target.style.overflow = "hidden";
        this.target.parentNode.style.overflow = "hidden";

        this.panel_els = this.target.children;

        this.reSize();
    }

    fScreen.prototype.timeout_lock = function() {
        if (this.timeS2 - this.timeS1 < 1000 * this.timeout) {
            this.timeS2 = new Date().getTime();
            return false;
        } else {
            this.timeS1 = new Date().getTime();
            this.timeS2 = new Date().getTime();
            return true;
        }
    }
    fScreen.prototype.nav_bind = function() {
        var self = this;
        if (this.nav) {
            for (var i = 0; i < this.nav_els.length; i++) {
                var el = this.nav_els[i];
                var bind_cb = (function(i) {
                    return function() {
                        self.active(i)
                    };
                })(i)
                addEvent(el, 'click', bind_cb)
            }
        }
    }
    fScreen.prototype.hook = function() {
        var self = this;
        // --------
        // wheel
        var wheel_cb = function(event) {
            if (!self.timeout_lock()) return false;
            var delta = 0;
            if (!event) //for ie
                event = window.event;
            if (event.wheelDelta) { //ie,opera
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = -event.detail / 3;
            }
            if (delta) {
                self.handle(delta);
            }
            if (event.cancelable) {
                if (!event.defaultPrevented) {
                    event.preventDefault();
                }
            }
            event.returnValue = false;
        };
        addEvent(this.target, 'DOMMouseScroll', wheel_cb, false)
        addEvent(this.target, 'mousewheel', wheel_cb, false)
        // --------
        // touch
        // var touch_delta = 0;
        // var move_delta = 0;
        var startY = 0;
        var startX = 0;
        var mStartY = 0;
        var moved = false;
        var tapBoundary = 10;
        var tapTime = 700;
        var lastTouchStartTime;
        var target = null;
        var touch_S_cb = function(event) {
            var touch = event.changedTouches[0];
            startY = touch.pageY;
            startX = touch.pageX;
            lastTouchStartTime = event.timeStamp;
            mStartY = startY;
            self.target.style.transition = "none";
            target = (event.target.nodeType === Node.TEXT_NODE ? event.target.parentNode : event.target);
            if (event.cancelable) {
                if (!event.defaultPrevented) {
                    event.preventDefault();
                }
            }
        };
        var touch_E_cb = function(event) {
            if (touchHasMoved === false && event.timeStamp - lastTouchStartTime < tapTime && target != null) {
                let tagName = target.tagName.toLowerCase(),
                    needFocus = false;
                switch (tagName) {
                    case 'textarea': // focus
                        needFocus = true;
                        break;
                    case 'input':
                        switch (target.type) {
                            case 'button':
                            case 'checkbox':
                            case 'file':
                            case 'image':
                            case 'radio':
                            case 'submit':
                                needFocus = false;
                                break;
                            default:
                                needFocus = !target.disabled && !target.readOnly;
                        }
                    default:
                        break;
                }
                if (needFocus) {
                    target.focus();
                } else {
                    event.preventDefault(); // prevent click 300ms later
                }

                let touch = event.changedTouches[0];
                let _event = document.createEvent('MouseEvents');
                _event.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
                _event.forwardedTouchEvent = true;
                _event.initEvent('click', true, true);
                target.dispatchEvent(_event);
            }
            // reset values
            lastTouchStartTime = undefined;
            touchHasMoved = false;
            target = null;

            var touch_delta = event.changedTouches[0].pageY - startY;
            self.target.style.transition = "all " + self.timeout + "s";
            if (f_abs(touch_delta) > self.target.clientHeight * self.touch_threshold) {
                self.handle(touch_delta);
            } else {
                self.active(self.cur_index)
            }
            if (event.cancelable) {
                if (!event.defaultPrevented) {
                    event.preventDefault();
                }
            }

        }
        var touch_M_cb = function(event) {
            var touch = event.changedTouches[0];
            var move_delta = touch.pageY - mStartY;
            move_delta = f_floor(move_delta);
            self.target.style.top = Number(self.target.style.top.slice(0, -2)) + move_delta + "px";

            mStartY = touch.clientY;
            if (event.cancelable) {
                if (!event.defaultPrevented) {
                    event.preventDefault();
                }
            }

            if (f_abs(touch.pageX - startX) > tapBoundary || f_abs(touch.pageY - startY) > tapBoundary) {
                touchHasMoved = true;
            }
        }
        addEvent(this.target, 'touchstart', touch_S_cb, false);
        addEvent(this.target, 'touchend', touch_E_cb, false);
        addEvent(this.target, 'touchmove', touch_M_cb, false);
        // ------
        // resize
        addEvent(this.target, 'resize', function() {
            self.reSize()
        }, false)
    }
    fScreen.prototype.handle = function(delta) {
        var index = this.cur_index;
        if (this.loop) {
            if (delta > 0) { //向上滚动
                index--;
            } else if (delta < 0) { //向下滚动
                index++;
            }
            index = index % this.panel_els.length;
            if (index < 0) index = this.panel_els.length + index;
        } else {
            if (delta > 0 && index > 0) { //向上滚动
                index--;
            } else if (delta < 0 && index < this.panel_els.length - 1) { //向下滚动
                index++;
            }
        }
        this.active(index)
    }
    fScreen.prototype.active = function(index_num) {
        this.cur_index = index_num;
        debug_mode && console.log("this.cur_index=>", this.cur_index);

        if (this.nav) {
            for (var i = 0; i < this.nav_els.length; i++) {
                var el = this.nav_els[i];
                if (i == index_num) {
                    addClass(el, "active");
                } else {
                    removeClass(el, "active");
                }
            }
        }

        this.target.style.top = -(index_num * this.wapperH) + "px";
    }

    window.fScreen = fScreen;
}(document, window)
