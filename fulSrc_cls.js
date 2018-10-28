// ---------
// util

const $ = q => {
    ret = document.querySelectorAll.call(document, q);
    return ret.length == 1 ? ret[0] : ret
}
const debug_mode = true;

function hasClass(ele, cls) {
  cls = cls || '';
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

class fScreen {
    constructor(conf) {
        this.init(conf);
        this.option(conf);
        this.hook();
        this.active(conf.default || 0);
    }
    option(conf) {
        this.timeout = conf.timeout || 0.6;
        this.target.style.transition = `all ${this.timeout}s`
        this.loop = conf.loop || false;

        this.nav = conf.nav || undefined;
        if(!this.nav)return;
        if (typeof this.nav == "string") this.nav = $(this.nav);
        this.nav_els = this.nav.children;

    }
    init(conf) {
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

        this.wapperH = this.target.clientHeight;
        for (let el of this.panel_els) {
            el.style.height = this.wapperH + "px";
        }
    }
    timeout_lock(){
        if(this.timeS2 - this.timeS1 < 1000*this.timeout){
            this.timeS2 = new Date().getTime();
            return false;
        }else{
            this.timeS1 = new Date().getTime();
            this.timeS2 = new Date().getTime();
            return true;
        }
    }
    hook() {
        var self = this;
        // --------
        // wheel
        var wheel_cb = function(event) {
            if(!self.timeout_lock())return false;
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
            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
        };
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', wheel_cb, false);
            window.addEventListener('mousewheel', wheel_cb, false);
        }else{
            window.onmousewheel = wheel_cb;
        }
        // --------
        // touch
        // var touch_delta = 0;
        // var move_delta = 0;
        var startY = 0;
        var mStartY = 0;
        var touch_S_cb = function(event) {
            startY = event.changedTouches[0].pageY;
            mStartY = startY;
            self.target.style.transition = `none`
        };
        var touch_E_cb = function(event){
            var touch_delta = event.changedTouches[0].pageY - startY;
            self.target.style.transition = `all ${self.timeout}s`
            if (touch_delta) {
                self.handle(touch_delta);
            }
            // event.preventDefault();
        }
        var touch_M_cb = function(event){
            var move_delta = event.changedTouches[0].pageY - mStartY;
            move_delta = Math.floor(move_delta)
            self.target.style.top = Number(self.target.style.top.slice(0,-2)) + move_delta + "px";

            mStartY = event.changedTouches[0].pageY;
            // event.preventDefault();
        }
        if (window.addEventListener) {
            window.addEventListener('touchstart', touch_S_cb, false);
            window.addEventListener('touchend', touch_E_cb, false);
            window.addEventListener('touchmove', touch_M_cb, false);
        }else{
            window.ontouchstart = touch_S_cb;
            window.ontouchend = touch_E_cb;
            window.ontouchmove = touch_M_cb;
        }
    }
    handle(delta) {
        var index = this.cur_index;
        if (this.loop) {
            if (delta > 0) { //向上滚动
                index--;
            } else if (delta < 0) { //向下滚动
                index++;
            }
            index = index % this.panel_els.length;
            if(index<0)index = this.panel_els.length + index;
        }else{
            if (delta > 0 && index > 0) { //向上滚动
                index--;
            } else if (delta < 0 && index < this.panel_els.length-1) { //向下滚动
                index++;
            }
        }
        this.active(index)
    }
    refresh() {

    }
    active(index_num) {
        // if(this.cur_index == index_num)return;

        this.cur_index = index_num;
        debug_mode && console.log("this.cur_index=>", this.cur_index);

        this.nav && this.nav_els.map((el,i)=>{
            if(i==index_num){
                addClass(el,"active");
            }else{
                removeClass(el,"active");
            }
        });

        this.target.style.top = -(index_num*this.wapperH) + "px";
    }
    down() {
        this.active(this.cur_index + 1);
    }
    up() {
        this.active(this.cur_index + 1);
    }
    go(index_num) {
        this.active(index_num);
    }
}
