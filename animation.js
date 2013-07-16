
;(function(S) {
    
    var docElem = document.documentElement,
        reKeywords = /^(?:transform|animation)/i,
        vendors = ['', 'Webkit', 'Moz', 'O', 'ms'],
        l = vendors.length,
        i = 0,
        v, a, 
        vendor, prefix, 
        anim, playState;
    
    for (; i < l; i++) {
        v = vendors[i];
        a = v ? 'Animation' : 'animation';
        if (typeof docElem.style[v + a] !== 'undefined') {
            vendor = v;
            prefix = v ? '-' + v.toLowerCase() + '-' : v;
            anim = v + a;
            playState = anim + 'PlayState';
            break;
        }
    }
    
    function getEventName(event) {
        if (vendor == 'Webkit' || vendor == 'ms') {
            return vendor.toLowerCase() + 'Animation' + event;
        } else if (vendor == 'O') {
            return vendor.toLowerCase() + 'animation' + event.toLowerCase();
        } else {
            return 'animation' + event.toLowerCase();
        }
    }
    
    var EVENTS = {
        start    : getEventName('Start'),
        end      : getEventName('End'),
        iteration: getEventName('Iteration')
    };
    
    function addRules(selector, rules) {
        var text = selector + '{',
            r, rv;
        
        for (r in rules) {
            if (rules.hasOwnProperty(r)) {
                rv = rules[r];
                if (typeof rv !== 'object') {
                    if (reKeywords.test(r)) {
                        r = prefix + r;
                    }
                    text += (r + ':' + rv + ';');
                } else {
                    text += addRules(r, rv);
                }
            }
        }
        
        text += '}';
        
        return text;
    }
    
    var stylesheet = document.createElement('style'),
        head = document.getElementsByTagName('head')[0];
        
    stylesheet.type = 'text/css';
    stylesheet.id = 'ks-animation-stylesheet';
    head.appendChild(stylesheet);
    
    function addKeyframe(keyframe, rules) {
        var csstext = addRules('@' + prefix + 'keyframes ' + keyframe, rules);
        
        stylesheet.appendChild(document.createTextNode(csstext));
        
        Animation.keyframes[keyframe] = 1;
    }
    
    function unit(v) {
        return (typeof v === 'number' || v.indexOf('s') < 0) ? (v + 's') : v;
    }
    
    function isEmpty(obj) {
        var ret = true;
        
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                ret = false;
                break;
            }
        }
        
        return ret;
    }
    
    function Animation() {
        this.init.apply(this, arguments);
    }
    
    Animation.support = typeof vendor === 'undefined' ? false : true;
    Animation.id = 0;
    Animation.keyframes = {};
    Animation.props = {
        duration: '0.5s',
        direction: 'normal',
        delay: '0s',
        easing: 'linear',
        mode: 'forwards',
        play: false,
        iteration: '1' 
    };
    
    Animation.addKeyframe = addKeyframe;
    
    Animation.prototype = {
        
        constructor: Animation,
        
        init: function(node, keyframe, config) {
            this.stop();
            
            if (typeof keyframe !== 'string') {
                config = keyframe;
                keyframe = 'ks-animation-keyframe-' + Animation.id++;
            }
            
            this.node = typeof node === 'string' ? document.querySelector(node) : node;
            this.keyframe = keyframe;
            this.config = config || {};
            this.props = {};
            this.played = false;
            this.running = false;
            
            this.events = this.keyword('on') || {};
            this.callbacks = {};
            this.initProps();
            
            if (this.props['play']) {
                this.play();
            }
        },
        
        initProps: function() {
            var def = Animation.props,
                props = this.props,
                v, k;
            
            for (k in def) {
                if (def.hasOwnProperty(k)) {
                    v = def[k];
                    props[k] = this.keyword(k);
                    if (typeof props[k] === 'undefined') {
                        props[k] = v;
                    }
                }
            }
        },
        
        attachEvent: function(name, def) {
            var self = this;
            this.callbacks[name] = function() {
                def && def.apply(self, arguments);
                self.events[name] && self.events[name].apply(self, arguments);    
            };
            this.node.addEventListener(EVENTS[name], this.callbacks[name], false);
        },
        
        attachEvents: function() {
            this.attachEvent('start');
            this.attachEvent('iteration');
            this.attachEvent('end', function() {
                this.stop();
            });
        },
        
        detachEvent: function(name) {
            this.node.removeEventListener(EVENTS[name], this.callbacks[name], false);
            delete this.callbacks[name];
        },
        
        detachEvents: function() {
            this.detachEvent('start');
            this.detachEvent('iteration');
            this.detachEvent('end');
        },
        
        keyword: function(name) {
            var value;
            if (typeof this.config[name] !== 'undefined') {
                value = this.config[name];
                delete this.config[name];
            }
            return value;
        },
        
        play: function() {
            var props = this.props,
                config = this.config,
                keyframe = this.keyframe;
            
            if (!this.played) {
                if (!(isEmpty(config) && Animation.keyframes[keyframe])) {
                    addKeyframe(keyframe, config);
                }
                this.attachEvents();
                this.node.style[anim] = [keyframe, unit(props.duration), props.easing, unit(props.delay), props.direction, props.iteration, props.mode].join(' ');
                this.played = true;
                this.running = true;
            }
            
            if (!this.running) {
                this.resume();
            }
            
            return this;
        },
        
        pause: function() {
            if (this.running) {
                this.node.style[playState] = 'paused';
                this.running = false;
            }
            return this;
        },
        
        resume: function() {
            if (!this.running) {
                this.node.style[playState] = 'running';
                this.running = true;
            }
            return this;
        },
        
        stop: function() {
            if (this.played) {
                this.detachEvents();
                this.node.style[anim] = '';
                this.node.style[playState] = '';
                this.running = false;
                this.played = false;
            }
            return this;
        }
        
    };
    
    window.Animation = Animation;
    
})();
