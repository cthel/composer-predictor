
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35731/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/Piano.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$1 = "src/Piano.svelte";

    function create_fragment$1(ctx) {
    	let div18;
    	let div17;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let div6;
    	let t13;
    	let div7;
    	let t15;
    	let div8;
    	let t17;
    	let div9;
    	let t19;
    	let div10;
    	let t21;
    	let div11;
    	let t23;
    	let div12;
    	let t25;
    	let div13;
    	let t27;
    	let div14;
    	let t29;
    	let div15;
    	let t31;
    	let div16;
    	let t33;
    	let audio0;
    	let audio0_src_value;
    	let t34;
    	let audio1;
    	let audio1_src_value;
    	let t35;
    	let audio2;
    	let audio2_src_value;
    	let t36;
    	let audio3;
    	let audio3_src_value;
    	let t37;
    	let audio4;
    	let audio4_src_value;
    	let t38;
    	let audio5;
    	let audio5_src_value;
    	let t39;
    	let audio6;
    	let audio6_src_value;
    	let t40;
    	let audio7;
    	let audio7_src_value;
    	let t41;
    	let audio8;
    	let audio8_src_value;
    	let t42;
    	let audio9;
    	let audio9_src_value;
    	let t43;
    	let audio10;
    	let audio10_src_value;
    	let t44;
    	let audio11;
    	let audio11_src_value;
    	let t45;
    	let audio12;
    	let audio12_src_value;
    	let t46;
    	let audio13;
    	let audio13_src_value;
    	let t47;
    	let audio14;
    	let audio14_src_value;
    	let t48;
    	let audio15;
    	let audio15_src_value;
    	let t49;
    	let audio16;
    	let audio16_src_value;
    	let t50;
    	let audio17;
    	let audio17_src_value;
    	let t51;
    	let audio18;
    	let audio18_src_value;
    	let t52;
    	let audio19;
    	let audio19_src_value;
    	let t53;
    	let audio20;
    	let audio20_src_value;
    	let t54;
    	let audio21;
    	let audio21_src_value;
    	let t55;
    	let audio22;
    	let audio22_src_value;
    	let t56;
    	let audio23;
    	let audio23_src_value;
    	let t57;
    	let audio24;
    	let audio24_src_value;
    	let t58;
    	let audio25;
    	let audio25_src_value;
    	let t59;
    	let audio26;
    	let audio26_src_value;
    	let t60;
    	let audio27;
    	let audio27_src_value;
    	let t61;
    	let audio28;
    	let audio28_src_value;
    	let t62;
    	let audio29;
    	let audio29_src_value;
    	let t63;
    	let audio30;
    	let audio30_src_value;
    	let t64;
    	let audio31;
    	let audio31_src_value;
    	let t65;
    	let audio32;
    	let audio32_src_value;
    	let t66;
    	let audio33;
    	let audio33_src_value;
    	let t67;
    	let audio34;
    	let audio34_src_value;
    	let t68;
    	let audio35;
    	let audio35_src_value;
    	let t69;
    	let audio36;
    	let audio36_src_value;
    	let t70;
    	let audio37;
    	let audio37_src_value;
    	let t71;
    	let audio38;
    	let audio38_src_value;
    	let t72;
    	let audio39;
    	let audio39_src_value;
    	let t73;
    	let audio40;
    	let audio40_src_value;
    	let t74;
    	let audio41;
    	let audio41_src_value;
    	let t75;
    	let audio42;
    	let audio42_src_value;
    	let t76;
    	let audio43;
    	let audio43_src_value;
    	let t77;
    	let audio44;
    	let audio44_src_value;
    	let t78;
    	let audio45;
    	let audio45_src_value;
    	let t79;
    	let audio46;
    	let audio46_src_value;
    	let t80;
    	let audio47;
    	let audio47_src_value;
    	let t81;
    	let audio48;
    	let audio48_src_value;
    	let t82;
    	let audio49;
    	let audio49_src_value;
    	let t83;
    	let audio50;
    	let audio50_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div17 = element("div");
    			div0 = element("div");
    			div0.textContent = "W";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "E";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "T";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Y";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "U";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "O";
    			t11 = space();
    			div6 = element("div");
    			div6.textContent = "P";
    			t13 = space();
    			div7 = element("div");
    			div7.textContent = "A";
    			t15 = space();
    			div8 = element("div");
    			div8.textContent = "S";
    			t17 = space();
    			div9 = element("div");
    			div9.textContent = "D";
    			t19 = space();
    			div10 = element("div");
    			div10.textContent = "F";
    			t21 = space();
    			div11 = element("div");
    			div11.textContent = "G";
    			t23 = space();
    			div12 = element("div");
    			div12.textContent = "H";
    			t25 = space();
    			div13 = element("div");
    			div13.textContent = "J";
    			t27 = space();
    			div14 = element("div");
    			div14.textContent = "K";
    			t29 = space();
    			div15 = element("div");
    			div15.textContent = "L";
    			t31 = space();
    			div16 = element("div");
    			div16.textContent = ";";
    			t33 = space();
    			audio0 = element("audio");
    			t34 = space();
    			audio1 = element("audio");
    			t35 = space();
    			audio2 = element("audio");
    			t36 = space();
    			audio3 = element("audio");
    			t37 = space();
    			audio4 = element("audio");
    			t38 = space();
    			audio5 = element("audio");
    			t39 = space();
    			audio6 = element("audio");
    			t40 = space();
    			audio7 = element("audio");
    			t41 = space();
    			audio8 = element("audio");
    			t42 = space();
    			audio9 = element("audio");
    			t43 = space();
    			audio10 = element("audio");
    			t44 = space();
    			audio11 = element("audio");
    			t45 = space();
    			audio12 = element("audio");
    			t46 = space();
    			audio13 = element("audio");
    			t47 = space();
    			audio14 = element("audio");
    			t48 = space();
    			audio15 = element("audio");
    			t49 = space();
    			audio16 = element("audio");
    			t50 = space();
    			audio17 = element("audio");
    			t51 = space();
    			audio18 = element("audio");
    			t52 = space();
    			audio19 = element("audio");
    			t53 = space();
    			audio20 = element("audio");
    			t54 = space();
    			audio21 = element("audio");
    			t55 = space();
    			audio22 = element("audio");
    			t56 = space();
    			audio23 = element("audio");
    			t57 = space();
    			audio24 = element("audio");
    			t58 = space();
    			audio25 = element("audio");
    			t59 = space();
    			audio26 = element("audio");
    			t60 = space();
    			audio27 = element("audio");
    			t61 = space();
    			audio28 = element("audio");
    			t62 = space();
    			audio29 = element("audio");
    			t63 = space();
    			audio30 = element("audio");
    			t64 = space();
    			audio31 = element("audio");
    			t65 = space();
    			audio32 = element("audio");
    			t66 = space();
    			audio33 = element("audio");
    			t67 = space();
    			audio34 = element("audio");
    			t68 = space();
    			audio35 = element("audio");
    			t69 = space();
    			audio36 = element("audio");
    			t70 = space();
    			audio37 = element("audio");
    			t71 = space();
    			audio38 = element("audio");
    			t72 = space();
    			audio39 = element("audio");
    			t73 = space();
    			audio40 = element("audio");
    			t74 = space();
    			audio41 = element("audio");
    			t75 = space();
    			audio42 = element("audio");
    			t76 = space();
    			audio43 = element("audio");
    			t77 = space();
    			audio44 = element("audio");
    			t78 = space();
    			audio45 = element("audio");
    			t79 = space();
    			audio46 = element("audio");
    			t80 = space();
    			audio47 = element("audio");
    			t81 = space();
    			audio48 = element("audio");
    			t82 = space();
    			audio49 = element("audio");
    			t83 = space();
    			audio50 = element("audio");
    			attr_dev(div0, "class", "black-key svelte-4ks8a3");
    			attr_dev(div0, "data-key", "w");
    			toggle_class(div0, "pressed", /*keys*/ ctx[0]['w']);
    			add_location(div0, file$1, 31, 8, 778);
    			attr_dev(div1, "class", "black-key svelte-4ks8a3");
    			attr_dev(div1, "data-key", "e");
    			toggle_class(div1, "pressed", /*keys*/ ctx[0]['e']);
    			add_location(div1, file$1, 32, 8, 856);
    			attr_dev(div2, "class", "black-key svelte-4ks8a3");
    			attr_dev(div2, "data-key", "t");
    			toggle_class(div2, "pressed", /*keys*/ ctx[0]['t']);
    			add_location(div2, file$1, 33, 8, 934);
    			attr_dev(div3, "class", "black-key svelte-4ks8a3");
    			attr_dev(div3, "data-key", "y");
    			toggle_class(div3, "pressed", /*keys*/ ctx[0]['y']);
    			add_location(div3, file$1, 34, 8, 1012);
    			attr_dev(div4, "class", "black-key svelte-4ks8a3");
    			attr_dev(div4, "data-key", "u");
    			toggle_class(div4, "pressed", /*keys*/ ctx[0]['u']);
    			add_location(div4, file$1, 35, 8, 1090);
    			attr_dev(div5, "class", "black-key svelte-4ks8a3");
    			attr_dev(div5, "data-key", "o");
    			toggle_class(div5, "pressed", /*keys*/ ctx[0]['o']);
    			add_location(div5, file$1, 36, 8, 1168);
    			attr_dev(div6, "class", "black-key svelte-4ks8a3");
    			attr_dev(div6, "data-key", "p");
    			toggle_class(div6, "pressed", /*keys*/ ctx[0]['p']);
    			add_location(div6, file$1, 37, 8, 1246);
    			attr_dev(div7, "class", "white-key svelte-4ks8a3");
    			attr_dev(div7, "data-key", "a");
    			toggle_class(div7, "pressed", /*keys*/ ctx[0]['a']);
    			add_location(div7, file$1, 39, 8, 1411);
    			attr_dev(div8, "class", "white-key svelte-4ks8a3");
    			attr_dev(div8, "data-key", "s");
    			toggle_class(div8, "pressed", /*keys*/ ctx[0]['s']);
    			add_location(div8, file$1, 40, 8, 1489);
    			attr_dev(div9, "class", "white-key svelte-4ks8a3");
    			attr_dev(div9, "data-key", "d");
    			toggle_class(div9, "pressed", /*keys*/ ctx[0]['d']);
    			add_location(div9, file$1, 41, 8, 1567);
    			attr_dev(div10, "class", "white-key svelte-4ks8a3");
    			attr_dev(div10, "data-key", "f");
    			toggle_class(div10, "pressed", /*keys*/ ctx[0]['f']);
    			add_location(div10, file$1, 42, 8, 1645);
    			attr_dev(div11, "class", "white-key svelte-4ks8a3");
    			attr_dev(div11, "data-key", "g");
    			toggle_class(div11, "pressed", /*keys*/ ctx[0]['g']);
    			add_location(div11, file$1, 43, 8, 1723);
    			attr_dev(div12, "class", "white-key svelte-4ks8a3");
    			attr_dev(div12, "data-key", "h");
    			toggle_class(div12, "pressed", /*keys*/ ctx[0]['h']);
    			add_location(div12, file$1, 44, 8, 1801);
    			attr_dev(div13, "class", "white-key svelte-4ks8a3");
    			attr_dev(div13, "data-key", "j");
    			toggle_class(div13, "pressed", /*keys*/ ctx[0]['j']);
    			add_location(div13, file$1, 45, 8, 1879);
    			attr_dev(div14, "class", "white-key svelte-4ks8a3");
    			attr_dev(div14, "data-key", "k");
    			toggle_class(div14, "pressed", /*keys*/ ctx[0]['k']);
    			add_location(div14, file$1, 46, 8, 1957);
    			attr_dev(div15, "class", "white-key svelte-4ks8a3");
    			attr_dev(div15, "data-key", "l");
    			toggle_class(div15, "pressed", /*keys*/ ctx[0]['l']);
    			add_location(div15, file$1, 47, 8, 2035);
    			attr_dev(div16, "class", "white-key svelte-4ks8a3");
    			attr_dev(div16, "data-key", ";");
    			toggle_class(div16, "pressed", /*keys*/ ctx[0][';']);
    			add_location(div16, file$1, 48, 8, 2113);
    			attr_dev(div17, "class", "piano svelte-4ks8a3");
    			add_location(div17, file$1, 30, 4, 750);
    			attr_dev(div18, "class", "piano-container svelte-4ks8a3");
    			add_location(div18, file$1, 29, 0, 716);
    			attr_dev(audio0, "class", "piano-sample");
    			attr_dev(audio0, "data-sample", "w");
    			if (!src_url_equal(audio0.src, audio0_src_value = "./samples/Cs4.mp3")) attr_dev(audio0, "src", audio0_src_value);
    			add_location(audio0, file$1, 53, 0, 2290);
    			attr_dev(audio1, "class", "piano-sample");
    			attr_dev(audio1, "data-sample", "e");
    			if (!src_url_equal(audio1.src, audio1_src_value = "./samples/Ds4.mp3")) attr_dev(audio1, "src", audio1_src_value);
    			add_location(audio1, file$1, 54, 0, 2360);
    			attr_dev(audio2, "class", "piano-sample");
    			attr_dev(audio2, "data-sample", "t");
    			if (!src_url_equal(audio2.src, audio2_src_value = "./samples/Fs4.mp3")) attr_dev(audio2, "src", audio2_src_value);
    			add_location(audio2, file$1, 55, 0, 2430);
    			attr_dev(audio3, "class", "piano-sample");
    			attr_dev(audio3, "data-sample", "y");
    			if (!src_url_equal(audio3.src, audio3_src_value = "./samples/Gs4.mp3")) attr_dev(audio3, "src", audio3_src_value);
    			add_location(audio3, file$1, 56, 0, 2500);
    			attr_dev(audio4, "class", "piano-sample");
    			attr_dev(audio4, "data-sample", "u");
    			if (!src_url_equal(audio4.src, audio4_src_value = "./samples/As4.mp3")) attr_dev(audio4, "src", audio4_src_value);
    			add_location(audio4, file$1, 57, 0, 2570);
    			attr_dev(audio5, "class", "piano-sample");
    			attr_dev(audio5, "data-sample", "o");
    			if (!src_url_equal(audio5.src, audio5_src_value = "./samples/Cs5.mp3")) attr_dev(audio5, "src", audio5_src_value);
    			add_location(audio5, file$1, 58, 0, 2640);
    			attr_dev(audio6, "class", "piano-sample");
    			attr_dev(audio6, "data-sample", "p");
    			if (!src_url_equal(audio6.src, audio6_src_value = "./samples/Ds5.mp3")) attr_dev(audio6, "src", audio6_src_value);
    			add_location(audio6, file$1, 59, 0, 2710);
    			attr_dev(audio7, "class", "piano-sample");
    			attr_dev(audio7, "data-sample", "zw");
    			if (!src_url_equal(audio7.src, audio7_src_value = "./samples/Cs3.mp3")) attr_dev(audio7, "src", audio7_src_value);
    			add_location(audio7, file$1, 61, 0, 2781);
    			attr_dev(audio8, "class", "piano-sample");
    			attr_dev(audio8, "data-sample", "ze");
    			if (!src_url_equal(audio8.src, audio8_src_value = "./samples/Ds3.mp3")) attr_dev(audio8, "src", audio8_src_value);
    			add_location(audio8, file$1, 62, 0, 2852);
    			attr_dev(audio9, "class", "piano-sample");
    			attr_dev(audio9, "data-sample", "zt");
    			if (!src_url_equal(audio9.src, audio9_src_value = "./samples/Fs3.mp3")) attr_dev(audio9, "src", audio9_src_value);
    			add_location(audio9, file$1, 63, 0, 2923);
    			attr_dev(audio10, "class", "piano-sample");
    			attr_dev(audio10, "data-sample", "zy");
    			if (!src_url_equal(audio10.src, audio10_src_value = "./samples/Gs3.mp3")) attr_dev(audio10, "src", audio10_src_value);
    			add_location(audio10, file$1, 64, 0, 2994);
    			attr_dev(audio11, "class", "piano-sample");
    			attr_dev(audio11, "data-sample", "zu");
    			if (!src_url_equal(audio11.src, audio11_src_value = "./samples/As3.mp3")) attr_dev(audio11, "src", audio11_src_value);
    			add_location(audio11, file$1, 65, 0, 3065);
    			attr_dev(audio12, "class", "piano-sample");
    			attr_dev(audio12, "data-sample", "zo");
    			if (!src_url_equal(audio12.src, audio12_src_value = "./samples/Cs4.mp3")) attr_dev(audio12, "src", audio12_src_value);
    			add_location(audio12, file$1, 66, 0, 3136);
    			attr_dev(audio13, "class", "piano-sample");
    			attr_dev(audio13, "data-sample", "zp");
    			if (!src_url_equal(audio13.src, audio13_src_value = "./samples/Ds4.mp3")) attr_dev(audio13, "src", audio13_src_value);
    			add_location(audio13, file$1, 67, 0, 3207);
    			attr_dev(audio14, "class", "piano-sample");
    			attr_dev(audio14, "data-sample", ".w");
    			if (!src_url_equal(audio14.src, audio14_src_value = "./samples/Cs5.mp3")) attr_dev(audio14, "src", audio14_src_value);
    			add_location(audio14, file$1, 69, 0, 3279);
    			attr_dev(audio15, "class", "piano-sample");
    			attr_dev(audio15, "data-sample", ".e");
    			if (!src_url_equal(audio15.src, audio15_src_value = "./samples/Ds5.mp3")) attr_dev(audio15, "src", audio15_src_value);
    			add_location(audio15, file$1, 70, 0, 3350);
    			attr_dev(audio16, "class", "piano-sample");
    			attr_dev(audio16, "data-sample", ".t");
    			if (!src_url_equal(audio16.src, audio16_src_value = "./samples/Fs5.mp3")) attr_dev(audio16, "src", audio16_src_value);
    			add_location(audio16, file$1, 71, 0, 3421);
    			attr_dev(audio17, "class", "piano-sample");
    			attr_dev(audio17, "data-sample", ".y");
    			if (!src_url_equal(audio17.src, audio17_src_value = "./samples/Gs5.mp3")) attr_dev(audio17, "src", audio17_src_value);
    			add_location(audio17, file$1, 72, 0, 3492);
    			attr_dev(audio18, "class", "piano-sample");
    			attr_dev(audio18, "data-sample", ".u");
    			if (!src_url_equal(audio18.src, audio18_src_value = "./samples/As5.mp3")) attr_dev(audio18, "src", audio18_src_value);
    			add_location(audio18, file$1, 73, 0, 3563);
    			attr_dev(audio19, "class", "piano-sample");
    			attr_dev(audio19, "data-sample", ".o");
    			if (!src_url_equal(audio19.src, audio19_src_value = "./samples/Cs6.mp3")) attr_dev(audio19, "src", audio19_src_value);
    			add_location(audio19, file$1, 74, 0, 3634);
    			attr_dev(audio20, "class", "piano-sample");
    			attr_dev(audio20, "data-sample", ".p");
    			if (!src_url_equal(audio20.src, audio20_src_value = "./samples/Ds6.mp3")) attr_dev(audio20, "src", audio20_src_value);
    			add_location(audio20, file$1, 75, 0, 3705);
    			attr_dev(audio21, "class", "piano-sample");
    			attr_dev(audio21, "data-sample", "a");
    			if (!src_url_equal(audio21.src, audio21_src_value = "./samples/C4.mp3")) attr_dev(audio21, "src", audio21_src_value);
    			add_location(audio21, file$1, 77, 0, 3777);
    			attr_dev(audio22, "class", "piano-sample");
    			attr_dev(audio22, "data-sample", "s");
    			if (!src_url_equal(audio22.src, audio22_src_value = "./samples/D4.mp3")) attr_dev(audio22, "src", audio22_src_value);
    			add_location(audio22, file$1, 78, 0, 3846);
    			attr_dev(audio23, "class", "piano-sample");
    			attr_dev(audio23, "data-sample", "d");
    			if (!src_url_equal(audio23.src, audio23_src_value = "./samples/E4.mp3")) attr_dev(audio23, "src", audio23_src_value);
    			add_location(audio23, file$1, 79, 0, 3915);
    			attr_dev(audio24, "class", "piano-sample");
    			attr_dev(audio24, "data-sample", "f");
    			if (!src_url_equal(audio24.src, audio24_src_value = "./samples/F4.mp3")) attr_dev(audio24, "src", audio24_src_value);
    			add_location(audio24, file$1, 80, 0, 3984);
    			attr_dev(audio25, "class", "piano-sample");
    			attr_dev(audio25, "data-sample", "g");
    			if (!src_url_equal(audio25.src, audio25_src_value = "./samples/G4.mp3")) attr_dev(audio25, "src", audio25_src_value);
    			add_location(audio25, file$1, 81, 0, 4053);
    			attr_dev(audio26, "class", "piano-sample");
    			attr_dev(audio26, "data-sample", "h");
    			if (!src_url_equal(audio26.src, audio26_src_value = "./samples/A4.mp3")) attr_dev(audio26, "src", audio26_src_value);
    			add_location(audio26, file$1, 82, 0, 4122);
    			attr_dev(audio27, "class", "piano-sample");
    			attr_dev(audio27, "data-sample", "j");
    			if (!src_url_equal(audio27.src, audio27_src_value = "./samples/B4.mp3")) attr_dev(audio27, "src", audio27_src_value);
    			add_location(audio27, file$1, 83, 0, 4191);
    			attr_dev(audio28, "class", "piano-sample");
    			attr_dev(audio28, "data-sample", "k");
    			if (!src_url_equal(audio28.src, audio28_src_value = "./samples/C5.mp3")) attr_dev(audio28, "src", audio28_src_value);
    			add_location(audio28, file$1, 84, 0, 4260);
    			attr_dev(audio29, "class", "piano-sample");
    			attr_dev(audio29, "data-sample", "l");
    			if (!src_url_equal(audio29.src, audio29_src_value = "./samples/D5.mp3")) attr_dev(audio29, "src", audio29_src_value);
    			add_location(audio29, file$1, 85, 0, 4329);
    			attr_dev(audio30, "class", "piano-sample");
    			attr_dev(audio30, "data-sample", ";");
    			if (!src_url_equal(audio30.src, audio30_src_value = "./samples/E5.mp3")) attr_dev(audio30, "src", audio30_src_value);
    			add_location(audio30, file$1, 86, 0, 4398);
    			attr_dev(audio31, "class", "piano-sample");
    			attr_dev(audio31, "data-sample", "za");
    			if (!src_url_equal(audio31.src, audio31_src_value = "./samples/C3.mp3")) attr_dev(audio31, "src", audio31_src_value);
    			add_location(audio31, file$1, 88, 0, 4468);
    			attr_dev(audio32, "class", "piano-sample");
    			attr_dev(audio32, "data-sample", "zs");
    			if (!src_url_equal(audio32.src, audio32_src_value = "./samples/D3.mp3")) attr_dev(audio32, "src", audio32_src_value);
    			add_location(audio32, file$1, 89, 0, 4538);
    			attr_dev(audio33, "class", "piano-sample");
    			attr_dev(audio33, "data-sample", "zd");
    			if (!src_url_equal(audio33.src, audio33_src_value = "./samples/E3.mp3")) attr_dev(audio33, "src", audio33_src_value);
    			add_location(audio33, file$1, 90, 0, 4608);
    			attr_dev(audio34, "class", "piano-sample");
    			attr_dev(audio34, "data-sample", "zf");
    			if (!src_url_equal(audio34.src, audio34_src_value = "./samples/F3.mp3")) attr_dev(audio34, "src", audio34_src_value);
    			add_location(audio34, file$1, 91, 0, 4678);
    			attr_dev(audio35, "class", "piano-sample");
    			attr_dev(audio35, "data-sample", "zg");
    			if (!src_url_equal(audio35.src, audio35_src_value = "./samples/G3.mp3")) attr_dev(audio35, "src", audio35_src_value);
    			add_location(audio35, file$1, 92, 0, 4748);
    			attr_dev(audio36, "class", "piano-sample");
    			attr_dev(audio36, "data-sample", "zh");
    			if (!src_url_equal(audio36.src, audio36_src_value = "./samples/A3.mp3")) attr_dev(audio36, "src", audio36_src_value);
    			add_location(audio36, file$1, 93, 0, 4818);
    			attr_dev(audio37, "class", "piano-sample");
    			attr_dev(audio37, "data-sample", "zj");
    			if (!src_url_equal(audio37.src, audio37_src_value = "./samples/B3.mp3")) attr_dev(audio37, "src", audio37_src_value);
    			add_location(audio37, file$1, 94, 0, 4888);
    			attr_dev(audio38, "class", "piano-sample");
    			attr_dev(audio38, "data-sample", "zk");
    			if (!src_url_equal(audio38.src, audio38_src_value = "./samples/C4.mp3")) attr_dev(audio38, "src", audio38_src_value);
    			add_location(audio38, file$1, 95, 0, 4958);
    			attr_dev(audio39, "class", "piano-sample");
    			attr_dev(audio39, "data-sample", "zl");
    			if (!src_url_equal(audio39.src, audio39_src_value = "./samples/D4.mp3")) attr_dev(audio39, "src", audio39_src_value);
    			add_location(audio39, file$1, 96, 0, 5028);
    			attr_dev(audio40, "class", "piano-sample");
    			attr_dev(audio40, "data-sample", "z;");
    			if (!src_url_equal(audio40.src, audio40_src_value = "./samples/E4.mp3")) attr_dev(audio40, "src", audio40_src_value);
    			add_location(audio40, file$1, 97, 0, 5098);
    			attr_dev(audio41, "class", "piano-sample");
    			attr_dev(audio41, "data-sample", ".a");
    			if (!src_url_equal(audio41.src, audio41_src_value = "./samples/C5.mp3")) attr_dev(audio41, "src", audio41_src_value);
    			add_location(audio41, file$1, 99, 0, 5169);
    			attr_dev(audio42, "class", "piano-sample");
    			attr_dev(audio42, "data-sample", ".s");
    			if (!src_url_equal(audio42.src, audio42_src_value = "./samples/D5.mp3")) attr_dev(audio42, "src", audio42_src_value);
    			add_location(audio42, file$1, 100, 0, 5239);
    			attr_dev(audio43, "class", "piano-sample");
    			attr_dev(audio43, "data-sample", ".d");
    			if (!src_url_equal(audio43.src, audio43_src_value = "./samples/E5.mp3")) attr_dev(audio43, "src", audio43_src_value);
    			add_location(audio43, file$1, 101, 0, 5309);
    			attr_dev(audio44, "class", "piano-sample");
    			attr_dev(audio44, "data-sample", ".f");
    			if (!src_url_equal(audio44.src, audio44_src_value = "./samples/F5.mp3")) attr_dev(audio44, "src", audio44_src_value);
    			add_location(audio44, file$1, 102, 0, 5379);
    			attr_dev(audio45, "class", "piano-sample");
    			attr_dev(audio45, "data-sample", ".g");
    			if (!src_url_equal(audio45.src, audio45_src_value = "./samples/G5.mp3")) attr_dev(audio45, "src", audio45_src_value);
    			add_location(audio45, file$1, 103, 0, 5449);
    			attr_dev(audio46, "class", "piano-sample");
    			attr_dev(audio46, "data-sample", ".h");
    			if (!src_url_equal(audio46.src, audio46_src_value = "./samples/A5.mp3")) attr_dev(audio46, "src", audio46_src_value);
    			add_location(audio46, file$1, 104, 0, 5519);
    			attr_dev(audio47, "class", "piano-sample");
    			attr_dev(audio47, "data-sample", ".j");
    			if (!src_url_equal(audio47.src, audio47_src_value = "./samples/B5.mp3")) attr_dev(audio47, "src", audio47_src_value);
    			add_location(audio47, file$1, 105, 0, 5589);
    			attr_dev(audio48, "class", "piano-sample");
    			attr_dev(audio48, "data-sample", ".k");
    			if (!src_url_equal(audio48.src, audio48_src_value = "./samples/C6.mp3")) attr_dev(audio48, "src", audio48_src_value);
    			add_location(audio48, file$1, 106, 0, 5659);
    			attr_dev(audio49, "class", "piano-sample");
    			attr_dev(audio49, "data-sample", ".l");
    			if (!src_url_equal(audio49.src, audio49_src_value = "./samples/D6.mp3")) attr_dev(audio49, "src", audio49_src_value);
    			add_location(audio49, file$1, 107, 0, 5729);
    			attr_dev(audio50, "class", "piano-sample");
    			attr_dev(audio50, "data-sample", ".;");
    			if (!src_url_equal(audio50.src, audio50_src_value = "./samples/E6.mp3")) attr_dev(audio50, "src", audio50_src_value);
    			add_location(audio50, file$1, 108, 0, 5799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div17);
    			append_dev(div17, div0);
    			append_dev(div17, t1);
    			append_dev(div17, div1);
    			append_dev(div17, t3);
    			append_dev(div17, div2);
    			append_dev(div17, t5);
    			append_dev(div17, div3);
    			append_dev(div17, t7);
    			append_dev(div17, div4);
    			append_dev(div17, t9);
    			append_dev(div17, div5);
    			append_dev(div17, t11);
    			append_dev(div17, div6);
    			append_dev(div17, t13);
    			append_dev(div17, div7);
    			append_dev(div17, t15);
    			append_dev(div17, div8);
    			append_dev(div17, t17);
    			append_dev(div17, div9);
    			append_dev(div17, t19);
    			append_dev(div17, div10);
    			append_dev(div17, t21);
    			append_dev(div17, div11);
    			append_dev(div17, t23);
    			append_dev(div17, div12);
    			append_dev(div17, t25);
    			append_dev(div17, div13);
    			append_dev(div17, t27);
    			append_dev(div17, div14);
    			append_dev(div17, t29);
    			append_dev(div17, div15);
    			append_dev(div17, t31);
    			append_dev(div17, div16);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, audio0, anchor);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, audio1, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, audio2, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, audio3, anchor);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, audio4, anchor);
    			insert_dev(target, t38, anchor);
    			insert_dev(target, audio5, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, audio6, anchor);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, audio7, anchor);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, audio8, anchor);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, audio9, anchor);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, audio10, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, audio11, anchor);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, audio12, anchor);
    			insert_dev(target, t46, anchor);
    			insert_dev(target, audio13, anchor);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, audio14, anchor);
    			insert_dev(target, t48, anchor);
    			insert_dev(target, audio15, anchor);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, audio16, anchor);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, audio17, anchor);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, audio18, anchor);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, audio19, anchor);
    			insert_dev(target, t53, anchor);
    			insert_dev(target, audio20, anchor);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, audio21, anchor);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, audio22, anchor);
    			insert_dev(target, t56, anchor);
    			insert_dev(target, audio23, anchor);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, audio24, anchor);
    			insert_dev(target, t58, anchor);
    			insert_dev(target, audio25, anchor);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, audio26, anchor);
    			insert_dev(target, t60, anchor);
    			insert_dev(target, audio27, anchor);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, audio28, anchor);
    			insert_dev(target, t62, anchor);
    			insert_dev(target, audio29, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, audio30, anchor);
    			insert_dev(target, t64, anchor);
    			insert_dev(target, audio31, anchor);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, audio32, anchor);
    			insert_dev(target, t66, anchor);
    			insert_dev(target, audio33, anchor);
    			insert_dev(target, t67, anchor);
    			insert_dev(target, audio34, anchor);
    			insert_dev(target, t68, anchor);
    			insert_dev(target, audio35, anchor);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, audio36, anchor);
    			insert_dev(target, t70, anchor);
    			insert_dev(target, audio37, anchor);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, audio38, anchor);
    			insert_dev(target, t72, anchor);
    			insert_dev(target, audio39, anchor);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, audio40, anchor);
    			insert_dev(target, t74, anchor);
    			insert_dev(target, audio41, anchor);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, audio42, anchor);
    			insert_dev(target, t76, anchor);
    			insert_dev(target, audio43, anchor);
    			insert_dev(target, t77, anchor);
    			insert_dev(target, audio44, anchor);
    			insert_dev(target, t78, anchor);
    			insert_dev(target, audio45, anchor);
    			insert_dev(target, t79, anchor);
    			insert_dev(target, audio46, anchor);
    			insert_dev(target, t80, anchor);
    			insert_dev(target, audio47, anchor);
    			insert_dev(target, t81, anchor);
    			insert_dev(target, audio48, anchor);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, audio49, anchor);
    			insert_dev(target, t83, anchor);
    			insert_dev(target, audio50, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeydown*/ ctx[1], false, false, false),
    					listen_dev(window, "keyup", /*handleKeyup*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*keys*/ 1) {
    				toggle_class(div0, "pressed", /*keys*/ ctx[0]['w']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div1, "pressed", /*keys*/ ctx[0]['e']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div2, "pressed", /*keys*/ ctx[0]['t']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div3, "pressed", /*keys*/ ctx[0]['y']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div4, "pressed", /*keys*/ ctx[0]['u']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div5, "pressed", /*keys*/ ctx[0]['o']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div6, "pressed", /*keys*/ ctx[0]['p']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div7, "pressed", /*keys*/ ctx[0]['a']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div8, "pressed", /*keys*/ ctx[0]['s']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div9, "pressed", /*keys*/ ctx[0]['d']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div10, "pressed", /*keys*/ ctx[0]['f']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div11, "pressed", /*keys*/ ctx[0]['g']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div12, "pressed", /*keys*/ ctx[0]['h']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div13, "pressed", /*keys*/ ctx[0]['j']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div14, "pressed", /*keys*/ ctx[0]['k']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div15, "pressed", /*keys*/ ctx[0]['l']);
    			}

    			if (dirty & /*keys*/ 1) {
    				toggle_class(div16, "pressed", /*keys*/ ctx[0][';']);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(audio0);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(audio1);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(audio2);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(audio3);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(audio4);
    			if (detaching) detach_dev(t38);
    			if (detaching) detach_dev(audio5);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(audio6);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(audio7);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(audio8);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(audio9);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(audio10);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(audio11);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(audio12);
    			if (detaching) detach_dev(t46);
    			if (detaching) detach_dev(audio13);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(audio14);
    			if (detaching) detach_dev(t48);
    			if (detaching) detach_dev(audio15);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(audio16);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(audio17);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(audio18);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(audio19);
    			if (detaching) detach_dev(t53);
    			if (detaching) detach_dev(audio20);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(audio21);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(audio22);
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(audio23);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(audio24);
    			if (detaching) detach_dev(t58);
    			if (detaching) detach_dev(audio25);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(audio26);
    			if (detaching) detach_dev(t60);
    			if (detaching) detach_dev(audio27);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(audio28);
    			if (detaching) detach_dev(t62);
    			if (detaching) detach_dev(audio29);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(audio30);
    			if (detaching) detach_dev(t64);
    			if (detaching) detach_dev(audio31);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(audio32);
    			if (detaching) detach_dev(t66);
    			if (detaching) detach_dev(audio33);
    			if (detaching) detach_dev(t67);
    			if (detaching) detach_dev(audio34);
    			if (detaching) detach_dev(t68);
    			if (detaching) detach_dev(audio35);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(audio36);
    			if (detaching) detach_dev(t70);
    			if (detaching) detach_dev(audio37);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(audio38);
    			if (detaching) detach_dev(t72);
    			if (detaching) detach_dev(audio39);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(audio40);
    			if (detaching) detach_dev(t74);
    			if (detaching) detach_dev(audio41);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(audio42);
    			if (detaching) detach_dev(t76);
    			if (detaching) detach_dev(audio43);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(audio44);
    			if (detaching) detach_dev(t78);
    			if (detaching) detach_dev(audio45);
    			if (detaching) detach_dev(t79);
    			if (detaching) detach_dev(audio46);
    			if (detaching) detach_dev(t80);
    			if (detaching) detach_dev(audio47);
    			if (detaching) detach_dev(t81);
    			if (detaching) detach_dev(audio48);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(audio49);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(audio50);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Piano', slots, []);
    	let keys = {};

    	function handleKeydown(event) {
    		if (!event.repeat) {
    			let key = event.key.toLowerCase();
    			$$invalidate(0, keys[key] = true, keys);

    			// console.log(keys)
    			if (keys['z']) key = 'z' + key; else if (keys['.']) key = '.' + key;

    			console.log(key);
    			const sample = document.querySelector(`[data-sample="${key}"]`);

    			if (sample) {
    				sample.currentTime = 0;
    				sample.play();
    			}
    		}
    	}

    	function handleKeyup(event) {
    		$$invalidate(0, keys[event.key.toLowerCase()] = false, keys);
    		console.log(keys);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Piano> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ keys, handleKeydown, handleKeyup });

    	$$self.$inject_state = $$props => {
    		if ('keys' in $$props) $$invalidate(0, keys = $$props.keys);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [keys, handleKeydown, handleKeyup];
    }

    class Piano extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Piano",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    // (1:0) <script>     import { fly }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>     import { fly }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import { fly }
    function create_then_block(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(1:0) <script>     import { fly }",
    		ctx
    	});

    	return block;
    }

    // (46:20)          <div class="loading">Loading... Please wait...</div>     {/await}
    function create_pending_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading... Please wait...";
    			attr_dev(div, "class", "loading svelte-d70vcx");
    			add_location(div, file, 46, 8, 1343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(46:20)          <div class=\\\"loading\\\">Loading... Please wait...</div>     {/await}",
    		ctx
    	});

    	return block;
    }

    // (73:8) {#if rand === '[0]'}
    function create_if_block_2(ctx) {
    	let p;
    	let p_intro;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.";
    			add_location(p, file, 73, 8, 2378);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, fly, { y: -10, duration: 1000 });
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(73:8) {#if rand === '[0]'}",
    		ctx
    	});

    	return block;
    }

    // (82:8) {#if rand === '[1]'}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.";
    			add_location(p, file, 82, 8, 3145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(82:8) {#if rand === '[1]'}",
    		ctx
    	});

    	return block;
    }

    // (91:8) {#if rand === '[2]'}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.";
    			add_location(p, file, 91, 8, 3860);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(91:8) {#if rand === '[2]'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let promise_1;
    	let t0;
    	let div0;
    	let form0;
    	let input0;
    	let t1;
    	let button;
    	let t3;
    	let form1;
    	let input1;
    	let t4;
    	let div4;
    	let div1;
    	let h20;
    	let t6;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let t8;
    	let div2;
    	let h21;
    	let t10;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let t12;
    	let div3;
    	let h22;
    	let t14;
    	let img2;
    	let img2_src_value;
    	let t15;
    	let t16;
    	let piano;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[0], info);
    	let if_block0 = /*rand*/ ctx[1] === '[0]' && create_if_block_2(ctx);
    	let if_block1 = /*rand*/ ctx[1] === '[1]' && create_if_block_1(ctx);
    	let if_block2 = /*rand*/ ctx[1] === '[2]' && create_if_block(ctx);
    	piano = new Piano({ $$inline: true });

    	const block = {
    		c: function create() {
    			info.block.c();
    			t0 = space();
    			div0 = element("div");
    			form0 = element("form");
    			input0 = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "TEST";
    			t3 = space();
    			form1 = element("form");
    			input1 = element("input");
    			t4 = space();
    			div4 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "BACH";
    			t6 = space();
    			img0 = element("img");
    			t7 = space();
    			if (if_block0) if_block0.c();
    			t8 = space();
    			div2 = element("div");
    			h21 = element("h2");
    			h21.textContent = "BEETHOVEN";
    			t10 = space();
    			img1 = element("img");
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			div3 = element("div");
    			h22 = element("h2");
    			h22.textContent = "SCHUBERT";
    			t14 = space();
    			img2 = element("img");
    			t15 = space();
    			if (if_block2) if_block2.c();
    			t16 = space();
    			create_component(piano.$$.fragment);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "name", "file");
    			attr_dev(input0, "accept", ".mid");
    			add_location(input0, file, 56, 8, 1665);
    			attr_dev(form0, "id", "file-upload");
    			add_location(form0, file, 55, 4, 1633);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 53, 0, 1545);
    			add_location(button, file, 62, 0, 1838);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Download";
    			add_location(input1, file, 64, 4, 1924);
    			attr_dev(form1, "method", "GET");
    			attr_dev(form1, "action", "k001.mid");
    			add_location(form1, file, 63, 0, 1882);
    			attr_dev(h20, "class", "svelte-d70vcx");
    			toggle_class(h20, "mystery", /*rand*/ ctx[1] !== '[0]');
    			add_location(h20, file, 70, 8, 2113);
    			if (!src_url_equal(img0.src, img0_src_value = "./Johann_Sebastian_Bach.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Bach");
    			attr_dev(img0, "class", "svelte-d70vcx");
    			toggle_class(img0, "mystery", /*rand*/ ctx[1] !== '[0]');
    			add_location(img0, file, 71, 12, 2170);
    			attr_dev(div1, "class", "bach svelte-d70vcx");
    			toggle_class(div1, "revealed", /*rand*/ ctx[1] === '[0]');
    			add_location(div1, file, 69, 4, 2054);
    			attr_dev(h21, "class", "svelte-d70vcx");
    			toggle_class(h21, "mystery", /*rand*/ ctx[1] !== '[1]');
    			add_location(h21, file, 79, 8, 2867);
    			if (!src_url_equal(img1.src, img1_src_value = "./Beethoven_by_Stieler_2.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Beethoven");
    			attr_dev(img1, "class", "svelte-d70vcx");
    			toggle_class(img1, "mystery", /*rand*/ ctx[1] !== '[1]');
    			add_location(img1, file, 80, 8, 2925);
    			attr_dev(div2, "class", "beethoven svelte-d70vcx");
    			toggle_class(div2, "revealed", /*rand*/ ctx[1] === '[1]');
    			add_location(div2, file, 78, 4, 2803);
    			attr_dev(h22, "class", "svelte-d70vcx");
    			toggle_class(h22, "mystery", /*rand*/ ctx[1] !== '[2]');
    			add_location(h22, file, 88, 8, 3597);
    			if (!src_url_equal(img2.src, img2_src_value = "./Franz_Schubert_2.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Schubert");
    			attr_dev(img2, "class", "svelte-d70vcx");
    			toggle_class(img2, "mystery", /*rand*/ ctx[1] !== '[2]');
    			add_location(img2, file, 89, 8, 3654);
    			attr_dev(div3, "class", "schubert svelte-d70vcx");
    			toggle_class(div3, "revealed", /*rand*/ ctx[1] === '[2]');
    			add_location(div3, file, 87, 4, 3534);
    			attr_dev(div4, "class", "composers svelte-d70vcx");
    			add_location(div4, file, 68, 0, 2026);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t0.parentNode;
    			info.anchor = t0;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, form0);
    			append_dev(form0, input0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, form1, anchor);
    			append_dev(form1, input1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t6);
    			append_dev(div1, img0);
    			append_dev(div1, t7);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div4, t8);
    			append_dev(div4, div2);
    			append_dev(div2, h21);
    			append_dev(div2, t10);
    			append_dev(div2, img1);
    			append_dev(div2, t11);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, h22);
    			append_dev(div3, t14);
    			append_dev(div3, img2);
    			append_dev(div3, t15);
    			if (if_block2) if_block2.m(div3, null);
    			insert_dev(target, t16, anchor);
    			mount_component(piano, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*handleSubmit*/ ctx[3], false, false, false),
    					listen_dev(button, "click", /*setPromise*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;
    			dirty & /*promise*/ 1 && promise_1 !== (promise_1 = /*promise*/ ctx[0]) && handle_promise(promise_1, info);

    			if (dirty & /*rand*/ 2) {
    				toggle_class(h20, "mystery", /*rand*/ ctx[1] !== '[0]');
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(img0, "mystery", /*rand*/ ctx[1] !== '[0]');
    			}

    			if (/*rand*/ ctx[1] === '[0]') {
    				if (if_block0) {
    					if (dirty & /*rand*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(div1, "revealed", /*rand*/ ctx[1] === '[0]');
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(h21, "mystery", /*rand*/ ctx[1] !== '[1]');
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(img1, "mystery", /*rand*/ ctx[1] !== '[1]');
    			}

    			if (/*rand*/ ctx[1] === '[1]') {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(div2, "revealed", /*rand*/ ctx[1] === '[1]');
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(h22, "mystery", /*rand*/ ctx[1] !== '[2]');
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(img2, "mystery", /*rand*/ ctx[1] !== '[2]');
    			}

    			if (/*rand*/ ctx[1] === '[2]') {
    				if (if_block2) ; else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div3, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*rand*/ 2) {
    				toggle_class(div3, "revealed", /*rand*/ ctx[1] === '[2]');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(piano.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(piano.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(form1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t16);
    			destroy_component(piano, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let rand = '...';

    	async function getRand() {
    		//   fetch("./rand")
    		let result = await fetch("./predict");

    		let resultText = await result.text();
    		handle(resultText);
    	}

    	function setPromise() {
    		$$invalidate(1, rand = '...');
    		$$invalidate(0, promise = getRand());
    	}

    	function handle(result) {
    		$$invalidate(1, rand = result);
    		document.body.style.position = 'relative';
    	}

    	let promise;

    	function handleSubmit(event) {
    		$$invalidate(1, rand = '...');
    		$$invalidate(0, promise = uploadFileFrom());
    	}

    	async function uploadFileFrom(event) {
    		// const formData = new FormData(event.target)
    		const formData = new FormData(document.querySelector('#file-upload'));

    		const response = await fetch('/upload', { method: 'POST', body: formData });
    		const responseText = await response.text();
    		if (response.ok) handle(responseText); else if (response.status === 413) alert('Your MIDI file is too large. Please try again with a smaller file.'); else alert('Sorry, something went wrong. Please try again with a different file.');
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fly,
    		Piano,
    		rand,
    		getRand,
    		setPromise,
    		handle,
    		promise,
    		handleSubmit,
    		uploadFileFrom
    	});

    	$$self.$inject_state = $$props => {
    		if ('rand' in $$props) $$invalidate(1, rand = $$props.rand);
    		if ('promise' in $$props) $$invalidate(0, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*promise*/ 1) {
    			document.body.style.position = promise ? 'fixed' : 'relative';
    		}
    	};

    	return [promise, rand, setPromise, handleSubmit];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	// props: {
    	// 	name: 'world'
    	// }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
