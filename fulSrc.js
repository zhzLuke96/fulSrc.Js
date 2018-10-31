// ---------
// util

var $ = function(q) {
    ret = document.querySelectorAll.call(document, q);
    return ret.length == 1 ? ret[0] : ret
}
var debug_mode = true;

var f_abs = function(n){return (n^(n>>31))-(n>>31)};
var f_floor = function(n){return ~~n};

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

// ----------
// fulsrc cls
function fScreen(conf) {
    this.init(conf);
    this.option(conf);
    this.hook();
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
    if (self.target.addEventListener) {
        self.target.addEventListener('DOMMouseScroll', wheel_cb, false);
        self.target.addEventListener('mousewheel', wheel_cb, false);
    } else {
        self.target.onmousewheel = wheel_cb;
    }
    // --------
    // touch
    // var touch_delta = 0;
    // var move_delta = 0;
    var startY = 0;
    var mStartY = 0;
    var touch_S_cb = function(event) {
        startY = event.changedTouches[0].clientY;
        mStartY = startY;
        self.target.style.transition = "none";
        if (event.cancelable) {
            if (!event.defaultPrevented) {
                event.preventDefault();
            }
        }
    };
    var touch_E_cb = function(event) {
        var touch_delta = event.changedTouches[0].clientY - startY;
        self.target.style.transition = "all " + self.timeout + "s";
        if (f_abs(touch_delta) > self.target.clientHeight * self.touch_threshold) {
            self.handle(touch_delta);
        }else{
            self.active(self.cur_index)
        }
        if (event.cancelable) {
            if (!event.defaultPrevented) {
                event.preventDefault();
            }
        }
    }
    var touch_M_cb = function(event) {
        var move_delta = event.changedTouches[0].clientY - mStartY;
        move_delta = f_floor(move_delta);
        self.target.style.top = Number(self.target.style.top.slice(0, -2)) + move_delta + "px";

        mStartY = event.changedTouches[0].clientY;
        if (event.cancelable) {
            if (!event.defaultPrevented) {
                event.preventDefault();
            }
        }
    }
    if (self.target.addEventListener) {
        self.target.addEventListener('touchstart', touch_S_cb, false);
        self.target.addEventListener('touchend', touch_E_cb, false);
        self.target.addEventListener('touchmove', touch_M_cb, false);
    }
    else {
        self.target.ontouchstart = touch_S_cb;
        self.target.ontouchend = touch_E_cb;
        self.target.ontouchmove = touch_M_cb;
    }
    // ------
    // resize
    if (window.addEventListener) {
        window.addEventListener('resize', function() {
            self.reSize()
        }, false);
    } else {
        window.onresize = function() {
            self.reSize()
        };
    }
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
            el = this.nav_els[i];
            if (i == index_num) {
                addClass(el, "active");
            } else {
                removeClass(el, "active");
            }
        }
    }

    this.target.style.top = -(index_num * this.wapperH) + "px";
}
